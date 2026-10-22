import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import {
  CLUB_STRIPE_ACCOUNT,
  consentText,
  tuitionItem,
  TUITION_TYPE,
  type TuitionPlan,
} from "./plan";
import { patchPlan, type PlanRecord } from "./store";

export async function assertTuitionStripe(mode: "test" | "live") {
  if (process.env.TUITION_ENABLED !== "true")
    throw new Error("Tuition is not enabled");
  const key = process.env.TRAINING_STRIPE_SECRET_KEY ?? "";
  if (!new RegExp(`^(sk|rk)_${mode}_`).test(key))
    throw new Error("Stripe mode does not match the approved plan");
  if (mode === "live" && process.env.TUITION_LIVE_ENABLED !== "true")
    throw new Error("Live tuition is not approved");
  const account = await trainingStripe.accounts.retrieve(null);
  if (account.id !== CLUB_STRIPE_ACCOUNT)
    throw new Error("Wrong Stripe account for tuition");
}

export function tuitionCustomerParams(p: TuitionPlan): Stripe.CustomerCreateParams {
  return {
      name: p.payer.name,
      email: p.payer.email,
      preferred_locales: ["sl"],
      ...(p.payer.accountingMode ? {} : {address: {
        line1: p.payer.address,
        postal_code: p.payer.postalCode,
        city: p.payer.city,
        country: p.payer.country,
      }}),
      metadata: { type: TUITION_TYPE, planId: p.id, payerId: p.payerId },
    };
}

// Call under the database plan lease. A new customer per obligation keeps personal
// plans distinct even when families share an email; Minimax uses stable payerId.
export async function ensureTuitionCustomer(record: PlanRecord) {
  if (record.customer_id) return record.customer_id;
  if (Date.now() - Date.parse(record.created_at) > 23 * 3600_000)
    throw new Error(
      "Customer creation needs reconciliation before retry (Stripe idempotency window)",
    );
  const p = record.manifest;
  const customer = await trainingStripe.customers.create(
    tuitionCustomerParams(p),
    { idempotencyKey: `tuition-customer-${p.id}` },
  );
  await patchPlan(record, { customer_id: customer.id });
  return customer.id;
}

export async function tuitionCheckout(
  record: PlanRecord,
): Promise<string | null> {
  const p = record.manifest;
  if (p.invitationFormat === "upn_only")
    throw new Error("UPN-only obligation has no card checkout");
  await assertTuitionStripe(p.mode);
  if (record.cancelled_at) throw new Error("Plan cancelled");
  if (record.first_payment_id) return null;
  if (record.first_payment_flow === "stripe_invoice") {
    const { invoicePaymentUrl } = await import("./invitation");
    return invoicePaymentUrl(record);
  }
  if (Date.now() + 31 * 60_000 >= Date.parse(p.firstPaymentDeadline))
    throw new Error("First payment deadline has passed or is too close");
  const customer = await ensureTuitionCustomer(record);
  // Recover an accepted session when the subsequent DB write failed. Listing is
  // strongly scoped to this obligation's customer; email is never a lookup key.
  let previous = record.checkout_id ?? "initial";
  for await (const session of trainingStripe.checkout.sessions.list({
    customer,
    limit: 100,
  })) {
    if (session.metadata?.planId !== p.id) continue;
    if (session.status === "complete") return null;
    if (session.status === "open" && session.url) {
      await patchPlan(record, { checkout_id: session.id });
      return session.url;
    }
    if (previous === "initial") previous = session.id;
  }
  const base = process.env.TUITION_SITE_URL ?? "https://www.apnea.si";
  const session = await trainingStripe.checkout.sessions.create(
    {
      mode: "payment",
      customer,
      client_reference_id: p.id,
      locale: "sl",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: p.first.amountCents,
            product: tuitionItem(p.locationCode).stripeProductId,
          },
        },
      ],
      payment_intent_data: {
        ...(p.second ? { setup_future_usage: "off_session" as const } : {}),
        description: `${p.description}; udeleženec: ${p.participant}; ${p.second ? "1. obrok" : "enkratno plačilo"}`,
        metadata: { type: TUITION_TYPE, planId: p.id, instalment: "1" },
      },
      metadata: { type: TUITION_TYPE, planId: p.id, instalment: "1" },
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message: `${consentText(p)} Sprejemam [pogoje poslovanja](${base}/pogoji).`,
        },
      },
      success_url: `${base}/vadnina/${p.id}?received=1`,
      cancel_url: `${base}/vadnina/${p.id}`,
      // Stripe Checkout lasts at most 24h; the private website link creates a fresh
      // session after expiry, without creating another obligation.
      expires_at: Math.floor(
        Math.min(
          Date.now() + 23 * 3600_000,
          Date.parse(p.firstPaymentDeadline),
        ) / 1000,
      ),
      invoice_creation: { enabled: false }, // Minimax is the accounting document.
    },
    { idempotencyKey: `tuition-checkout-${p.id}-${previous}` },
  );
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  await patchPlan(record, { checkout_id: session.id });
  return session.url;
}

export function secondScheduleParams(
  record: PlanRecord,
  paymentMethod: string,
): Stripe.SubscriptionScheduleCreateParams {
  const p = record.manifest,
    second = p.second;
  if (!second || !record.customer_id)
    throw new Error("Missing second instalment/customer");
  const start = Math.floor(Date.parse(second.chargeAt) / 1000);
  // A single monthly cycle, then cancellation. Only one price exists on this
  // schedule; the first instalment was a separate Checkout payment.
  const end = new Date(second.chargeAt);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return {
    customer: record.customer_id,
    start_date: start,
    end_behavior: "cancel",
    metadata: { type: TUITION_TYPE, planId: p.id, instalment: "2" },
    default_settings: {
      collection_method: "charge_automatically",
      default_payment_method: paymentMethod,
    },
    phases: [
      {
        end_date: Math.floor(end.getTime() / 1000),
        items: [
          {
            price_data: {
              currency: "eur",
              product: tuitionItem(p.locationCode).stripeProductId,
              unit_amount: second.amountCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        billing_cycle_anchor: "phase_start",
        proration_behavior: "none",
        automatic_tax: { enabled: false },
        metadata: { type: TUITION_TYPE, planId: p.id, instalment: "2" },
      },
    ],
  };
}

export function verifySecondSchedule(
  schedule: Stripe.SubscriptionSchedule,
  record: PlanRecord,
) {
  const expected = secondScheduleParams(record, "unused");
  const phase = schedule.phases[0],
    price = phase?.items[0]?.price;
  if (
    schedule.customer !== record.customer_id ||
    schedule.metadata?.planId !== record.id ||
    schedule.end_behavior !== "cancel" ||
    schedule.phases.length !== 1 ||
    !phase ||
    phase.items.length !== 1 ||
    phase.items[0].quantity !== 1 ||
    phase.start_date !== expected.start_date ||
    phase.end_date !== expected.phases![0].end_date ||
    phase.add_invoice_items.length !== 0 ||
    phase.proration_behavior !== "none" ||
    phase.automatic_tax?.enabled ||
    (phase.default_tax_rates?.length ?? 0) > 0 ||
    (phase.discounts?.length ?? 0) > 0 ||
    phase.trial_end != null ||
    phase.billing_thresholds != null ||
    (phase.items[0].tax_rates?.length ?? 0) > 0 ||
    !price ||
    typeof price === "string" ||
    "deleted" in price ||
    price.currency !== "eur" ||
    price.unit_amount !== record.manifest.second!.amountCents ||
    price.recurring?.interval !== "month" ||
    price.recurring.interval_count !== 1
  )
    throw new Error(
      "Existing Stripe schedule differs from the approved finite instalment",
    );
}

export async function ensureSecondSchedule(record: PlanRecord) {
  if (record.manifest.invitationFormat === "upn_only") {
    if (record.manifest.second || record.schedule_id)
      throw new Error("UPN-only obligation cannot have a card schedule");
    return;
  }
  if (!record.manifest.second || record.cancelled_at || record.schedule_id)
    return;
  if (!record.first_payment_id || !record.customer_id) return;
  if (!record.consent_session_id && !record.consent_invoice_id)
    throw new Error("Missing recorded card-charge consent");
  tuitionItem(record.manifest.locationCode);
  // Recover creation before using the idempotency key, even after 24 hours.
  const matches: Stripe.SubscriptionSchedule[] = [];
  for await (const s of trainingStripe.subscriptionSchedules.list({
    customer: record.customer_id,
    limit: 100,
  })) {
    if (s.metadata?.planId === record.id) matches.push(s);
  }
  if (matches.length > 1)
    throw new Error("Multiple schedules need manual reconciliation");
  if (matches.length === 1) {
    const existing = await trainingStripe.subscriptionSchedules.retrieve(
      matches[0].id,
      { expand: ["phases.items.price"] },
    );
    verifySecondSchedule(existing, record);
    await patchPlan(record, { schedule_id: matches[0].id });
    return;
  }
  if (Date.now() + 3600_000 >= Date.parse(record.manifest.second.chargeAt))
    throw new Error(
      "Second charge date too close/past; operator review required",
    );
  const intent = await trainingStripe.paymentIntents.retrieve(
    record.first_payment_id,
  );
  if (
    intent.status !== "succeeded" ||
    intent.metadata.planId !== record.id ||
    !intent.payment_method ||
    (record.manifest.second && intent.setup_future_usage !== "off_session")
  )
    throw new Error("First payment/card not verified");
  const pm =
    typeof intent.payment_method === "string"
      ? intent.payment_method
      : intent.payment_method.id;
  const schedule = await trainingStripe.subscriptionSchedules.create(
    secondScheduleParams(record, pm),
    { idempotencyKey: `tuition-second-${record.id}` },
  );
  const created = await trainingStripe.subscriptionSchedules.retrieve(
    schedule.id,
    { expand: ["phases.items.price"] },
  );
  try {
    verifySecondSchedule(created, record);
  } catch (error) {
    await trainingStripe.subscriptionSchedules.cancel(schedule.id, {
      invoice_now: false,
      prorate: false,
    });
    throw error;
  }
  await patchPlan(record, { schedule_id: schedule.id });
}

export async function cancelTuition(record: PlanRecord) {
  await assertTuitionStripe(record.manifest.mode);
  // Persist the operator's cancellation first. A subsequent failure stays visible
  // and prevents the worker from creating a new schedule.
  if (!record.cancelled_at)
    await patchPlan(record, { cancelled_at: new Date().toISOString() });
  if (record.first_payment_flow === "stripe_invoice") {
    const { cancelFirstInvoice } = await import("./invitation");
    await cancelFirstInvoice(record);
  }
  if (record.checkout_id) {
    const session = await trainingStripe.checkout.sessions.retrieve(
      record.checkout_id,
    );
    if (session.status === "open")
      await trainingStripe.checkout.sessions.expire(session.id);
  }
  if (record.customer_id) {
    for await (const schedule of trainingStripe.subscriptionSchedules.list({
      customer: record.customer_id,
      limit: 100,
    })) {
      if (
        schedule.metadata?.planId !== record.id ||
        !["not_started", "active"].includes(schedule.status)
      )
        continue;
      // No prorations or final invoice on cancellation. Already paid charges are
      // never refunded by this action.
      await trainingStripe.subscriptionSchedules.cancel(schedule.id, {
        invoice_now: false,
        prorate: false,
      });
    }
  }
  await patchPlan(record, { cancellation_confirmed: true, error: null });
}
