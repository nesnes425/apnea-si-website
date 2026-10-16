import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import { z } from "zod";
import { TUITION_TYPE } from "./plan";
import { assertTuitionStripe } from "./stripe";
import {
  claimPlan,
  getPlan,
  patchPlan,
  recordPayment,
  releasePlan,
} from "./store";
import { processTuitionPlan } from "./worker";

function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

export function verifyPaidIntent(
  intent: Stripe.PaymentIntent,
  expected: {
    amountCents: number;
    customerId: string;
    live: boolean;
  },
) {
  if (
    intent.status !== "succeeded" ||
    intent.currency !== "eur" ||
    intent.amount !== expected.amountCents ||
    intent.amount_received !== expected.amountCents ||
    objectId(intent.customer) !== expected.customerId ||
    intent.livemode !== expected.live
  )
    throw new Error("Paid tuition amount/customer/mode mismatch");
}

export async function handleTuitionEvent(
  event: Stripe.Event,
): Promise<boolean> {
  if (event.type === "checkout.session.completed") {
    const raw = event.data.object;
    if (raw.metadata?.type !== TUITION_TYPE) return false;
    const session = await trainingStripe.checkout.sessions.retrieve(raw.id);
    const id = z.uuid().parse(session.metadata?.planId);
    const plan = await claimPlan(id);
    try {
      await assertTuitionStripe(plan.manifest.mode);
      if (
        session.status !== "complete" ||
        session.payment_status !== "paid" ||
        session.mode !== "payment" ||
        session.consent?.terms_of_service !== "accepted" ||
        session.currency !== "eur" ||
        session.amount_total !== plan.manifest.first.amountCents ||
        objectId(session.customer) !== plan.customer_id ||
        session.livemode !== (plan.manifest.mode === "live")
      )
        throw new Error("Tuition checkout verification failed");
      const intentId = objectId(session.payment_intent);
      if (!intentId || !plan.customer_id)
        throw new Error("Missing tuition payment/customer");
      const intent = await trainingStripe.paymentIntents.retrieve(intentId);
      verifyPaidIntent(intent, {
        amountCents: plan.manifest.first.amountCents,
        customerId: plan.customer_id,
        live: plan.manifest.mode === "live",
      });
      if (
        intent.metadata.planId !== id ||
        intent.metadata.type !== TUITION_TYPE ||
        (plan.manifest.second && intent.setup_future_usage !== "off_session")
      )
        throw new Error("Payment metadata/card agreement mismatch");
      if (plan.first_payment_id && plan.first_payment_id !== intentId)
        throw new Error(
          "A distinct first payment already exists; reconcile duplicate",
        );
      await recordPayment({
        id: intentId,
        plan_id: id,
        instalment: 1,
        amount_cents: intent.amount_received,
        paid_at: new Date(event.created * 1000).toISOString(),
      });
      await patchPlan(plan, {
        first_payment_id: intentId,
        checkout_id: session.id,
        consent_session_id: session.id,
      });
    } finally {
      await releasePlan(plan);
    }
    const result = await processTuitionPlan(id);
    if (result.problems.length)
      throw new Error("Tuition integration pending reconciliation");
    return true;
  }
  if (
    ![
      "invoice.paid",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
      "invoice.payment_action_required",
    ].includes(event.type)
  )
    return false;
  if (!("id" in event.data.object)) return false;
  const invoice = await trainingStripe.invoices.retrieve(event.data.object.id);
  const subscriptionId = objectId(
    invoice.parent?.subscription_details?.subscription,
  );
  if (!subscriptionId) return false;
  const subscription =
    await trainingStripe.subscriptions.retrieve(subscriptionId);
  if (subscription.metadata.type !== TUITION_TYPE) return false;
  const id = z.uuid().parse(subscription.metadata.planId);
  const plan = await getPlan(id);
  if (!plan?.manifest.second || !plan.customer_id || !plan.schedule_id)
    throw new Error("Unrecognized tuition schedule");
  await assertTuitionStripe(plan.manifest.mode);
  if (
    objectId(invoice.customer) !== plan.customer_id ||
    invoice.livemode !== (plan.manifest.mode === "live")
  )
    throw new Error("Tuition invoice customer/mode mismatch");
  if (subscription.schedule) {
    if (objectId(subscription.schedule) !== plan.schedule_id)
      throw new Error("Tuition invoice schedule mismatch");
  } else {
    // Late/replayed events can arrive after the finite schedule completed.
    const schedule = await trainingStripe.subscriptionSchedules.retrieve(
      plan.schedule_id,
    );
    if (
      schedule.metadata?.planId !== id ||
      objectId(schedule.customer) !== plan.customer_id ||
      !["completed", "canceled"].includes(schedule.status)
    )
      throw new Error("Unrecognized completed schedule");
  }
  if (
    ["invoice.payment_failed", "invoice.payment_action_required"].includes(
      event.type,
    )
  ) {
    const locked = await claimPlan(id);
    try {
      await patchPlan(locked, {
        collection_invoice_id: invoice.id,
        collection_error:
          invoice.status === "paid"
            ? null
            : "Second payment failed or needs cardholder authentication; inspect this invoice in Stripe",
      });
    } finally {
      await releasePlan(locked);
    }
    return true;
  }
  if (
    invoice.status !== "paid" ||
    invoice.currency !== "eur" ||
    invoice.amount_paid !== plan.manifest.second.amountCents ||
    invoice.total !== plan.manifest.second.amountCents ||
    objectId(invoice.customer) !== plan.customer_id ||
    invoice.livemode !== (plan.manifest.mode === "live")
  )
    throw new Error("Second instalment invoice mismatch");
  const payments = await trainingStripe.invoicePayments.list({
    invoice: invoice.id,
    limit: 100,
  });
  const paid = payments.data.filter(
    (p) => p.status === "paid" && p.payment.type === "payment_intent",
  );
  if (payments.has_more || paid.length !== 1 || !paid[0].payment.payment_intent)
    throw new Error("Invoice has no single verified Stripe card payment");
  const intentId = objectId(paid[0].payment.payment_intent)!;
  const intent = await trainingStripe.paymentIntents.retrieve(intentId);
  verifyPaidIntent(intent, {
    amountCents: plan.manifest.second.amountCents,
    customerId: plan.customer_id,
    live: plan.manifest.mode === "live",
  });
  await recordPayment({
    id: intentId,
    plan_id: id,
    instalment: 2,
    amount_cents: intent.amount_received,
    paid_at: new Date(
      (invoice.status_transitions.paid_at ?? event.created) * 1000,
    ).toISOString(),
  });
  const locked = await claimPlan(id);
  try {
    await patchPlan(locked, {
      collection_error: null,
      collection_invoice_id: invoice.id,
    });
  } finally {
    await releasePlan(locked);
  }
  const result = await processTuitionPlan(id);
  if (result.problems.length)
    throw new Error("Tuition integration pending reconciliation");
  return true;
}
