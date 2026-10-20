import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import { assertTuitionStripe, ensureTuitionCustomer } from "./stripe";
import {
  TUITION_TYPE,
  tuitionItem,
  invoicePaymentNotice,
  invoiceConsentHash,
} from "./plan";
import { patchPlan, type PlanRecord } from "./store";

export function firstInvoiceParams(
  record: PlanRecord,
  customer: string,
): Stripe.InvoiceCreateParams {
  const p = record.manifest;
  return {
    customer,
    currency: "eur",
    collection_method: "send_invoice",
    auto_advance: false,
    due_date: Math.floor(Date.parse(p.firstPaymentDeadline) / 1000),
    pending_invoice_items_behavior: "exclude",
    automatic_tax: { enabled: false },
    default_tax_rates: [],
    discounts: [],
    payment_settings: { payment_method_types: ["card"] },
    description: invoicePaymentNotice(p),
    footer: process.env.MINIMAX_TUITION_VAT_CLAUSE,
    metadata: {
      type: TUITION_TYPE,
      planId: record.id,
      instalment: "1",
      manifest_hash: record.fingerprint,
      consent_hash: invoiceConsentHash(p),
    },
  };
}
function objectId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}
export function verifyFirstInvoice(
  invoice: Stripe.Invoice,
  record: PlanRecord,
  allowEmptyDraft = false,
) {
  const p = record.manifest;
  const lines = invoice.lines.data;
  if (
    objectId(invoice.customer) !== record.customer_id ||
    invoice.customer_email?.toLowerCase() !== p.payer.email.toLowerCase() ||
    invoice.livemode !== (p.mode === "live") ||
    invoice.collection_method !== "send_invoice" ||
    invoice.auto_advance ||
    invoice.metadata?.type !== TUITION_TYPE ||
    invoice.metadata.planId !== record.id ||
    invoice.metadata.instalment !== "1" ||
    invoice.metadata.manifest_hash !== record.fingerprint ||
    invoice.metadata.consent_hash !== invoiceConsentHash(p) ||
    invoice.description !== invoicePaymentNotice(p) ||
    invoice.footer !== (process.env.MINIMAX_TUITION_VAT_CLAUSE ?? null) ||
    invoice.due_date !==
      Math.floor(Date.parse(p.firstPaymentDeadline) / 1000) ||
    invoice.parent?.subscription_details ||
    invoice.currency !== "eur" ||
    invoice.lines.has_more ||
    invoice.automatic_tax.enabled ||
    invoice.discounts.length ||
    invoice.default_tax_rates.length ||
    (invoice.total_taxes?.some((t) => t.amount !== 0) ?? false) ||
    !["draft", "open", "paid"].includes(invoice.status ?? "")
  )
    throw new Error(
      "First Stripe payment request differs from approved obligation",
    );
  if (
    allowEmptyDraft &&
    invoice.status === "draft" &&
    lines.length === 0 &&
    invoice.total === 0
  )
    return;
  const line = lines[0];
  if (
    lines.length !== 1 ||
    !line ||
    line.amount !== p.first.amountCents ||
    line.quantity !== 1 ||
    line.metadata.planId !== record.id ||
    line.pricing?.price_details?.product !==
      tuitionItem(p.locationCode).stripeProductId ||
    invoice.total !== p.first.amountCents ||
    (invoice.status !== "paid" && invoice.amount_due !== p.first.amountCents) ||
    (invoice.status === "paid" &&
      (invoice.amount_paid !== p.first.amountCents ||
        invoice.amount_remaining !== 0))
  )
    throw new Error("First Stripe payment request amount or item mismatch");
}
// Called while holding the plan lease. Recovery uses the customer and plan ID,
// never email; listing avoids relying on Stripe's 24-hour idempotency retention.
export async function ensureFirstInvoice(record: PlanRecord) {
  await assertTuitionStripe(record.manifest.mode);
  if (
    record.first_payment_flow !== "stripe_invoice" ||
    record.cancelled_at ||
    record.first_payment_id
  )
    throw new Error("This obligation cannot create a new Stripe request");
  const customer = await ensureTuitionCustomer(record);
  if (record.checkout_id)
    throw new Error("An existing Checkout requires reconciliation");
  const matches: Stripe.Invoice[] = [];
  for await (const invoice of trainingStripe.invoices.list({
    customer,
    limit: 100,
  })) {
    if (
      invoice.metadata?.type === TUITION_TYPE &&
      invoice.metadata.planId === record.id
    )
      matches.push(invoice);
  }
  if (matches.length > 1)
    throw new Error("Multiple Stripe requests require reconciliation");
  let invoice = matches[0];
  if (record.first_invoice_id && invoice?.id !== record.first_invoice_id)
    throw new Error("Stored Stripe request could not be recovered");
  if (!invoice)
    invoice = await trainingStripe.invoices.create(
      firstInvoiceParams(record, customer),
      { idempotencyKey: `tuition-first-invoice-${record.id}` },
    );
  verifyFirstInvoice(invoice, record, true);
  if (invoice.status === "draft" && invoice.lines.data.length === 0) {
    await trainingStripe.invoiceItems.create(
      {
        customer,
        invoice: invoice.id,
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: record.manifest.first.amountCents,
          product: tuitionItem(record.manifest.locationCode).stripeProductId,
        },
        discountable: false,
        tax_rates: [],
        description: `${record.manifest.description}; ${record.manifest.participant}; 1. obrok; ${record.manifest.first.serviceFrom}–${record.manifest.first.serviceTo}`,
        metadata: { type: TUITION_TYPE, planId: record.id, instalment: "1" },
      },
      { idempotencyKey: `tuition-first-line-${record.id}` },
    );
    invoice = await trainingStripe.invoices.retrieve(invoice.id);
  }
  verifyFirstInvoice(invoice, record);
  await patchPlan(record, { first_invoice_id: invoice.id });
  return invoice;
}
export async function firstInvoiceIntent(invoiceId: string) {
  const payments = await trainingStripe.invoicePayments.list({
    invoice: invoiceId,
    limit: 100,
  });
  const defaults = payments.data.filter(
    (p) => p.is_default && p.payment.type === "payment_intent",
  );
  const id = objectId(defaults[0]?.payment.payment_intent);
  if (payments.has_more || defaults.length !== 1 || !id)
    throw new Error("Stripe request has no unique default PaymentIntent");
  return trainingStripe.paymentIntents.retrieve(id);
}

export type InvitationDeps = {
  save: (patch: Partial<PlanRecord>) => Promise<void>;
  send: () => Promise<void>;
};
// Ambiguous acceptance is held for operator reconciliation, never auto-resend.
export async function submitInvitation(
  record: PlanRecord,
  deps: InvitationDeps,
) {
  if (record.invitation_state === "submitted") return "submitted";
  if (
    record.invitation_state === "sending" ||
    record.invitation_state === "uncertain"
  ) {
    await deps.save({ invitation_state: "uncertain" });
    throw new Error(
      "Inspect invitation provider delivery history before any resend",
    );
  }
  await deps.save({
    invitation_state: "sending",
    invitation_requested_at: new Date().toISOString(),
  });
  try {
    await deps.send();
    await deps.save({
      invitation_state: "submitted",
      invitation_submitted_at: new Date().toISOString(),
      error: null,
    });
  } catch (error) {
    await deps.save({
      invitation_state: "uncertain",
      error:
        "Invitation acceptance uncertain; inspect provider delivery history before retry",
    });
    throw error;
  }
  return "submitted";
}

// Prepare/finalize the hosted payment page without sending a Stripe email.
export async function prepareFirstInvitation(record: PlanRecord) {
  if (record.manifest.invitationFormat === "upn_only")
    throw new Error("UPN-only obligation cannot activate card collection");
  await assertTuitionStripe(record.manifest.mode);
  if (record.cancelled_at || record.first_payment_id || record.bank_state)
    throw new Error("Obligation is closed or paid");
  if (Date.now() + 3600_000 >= Date.parse(record.manifest.firstPaymentDeadline))
    throw new Error("Payment deadline is too close or passed");
  const customer = await trainingStripe.customers.retrieve(record.customer_id!);
  if (
    customer.deleted ||
    customer.email?.toLowerCase() !==
      record.manifest.payer.email.toLowerCase() ||
    customer.metadata.planId !== record.id
  )
    throw new Error(
      "Stripe email recipient no longer matches the approved payer",
    );
  let invoice = await ensureFirstInvoice(record);
  if (invoice.status === "draft")
    invoice = await trainingStripe.invoices.finalizeInvoice(
      invoice.id,
      { auto_advance: false },
      { idempotencyKey: `tuition-finalize-${record.id}` },
    );
  verifyFirstInvoice(invoice, record);
  if (invoice.status !== "open") throw new Error("Request is no longer open");
  const intent = await firstInvoiceIntent(invoice.id);
  if (
    intent.status !== "requires_payment_method" ||
    objectId(intent.customer) !== record.customer_id
  )
    throw new Error(
      "Payment request is already in progress; inspect before sending",
    );
  await trainingStripe.paymentIntents.update(
    intent.id,
    {
      ...(record.manifest.second
        ? { setup_future_usage: "off_session" as const }
        : {}),
      metadata: {
        type: TUITION_TYPE,
        planId: record.id,
        instalment: "1",
        consent_hash: invoiceConsentHash(record.manifest),
      },
    },
    { idempotencyKey: `tuition-first-card-${record.id}` },
  );
  const configured = await trainingStripe.paymentIntents.retrieve(intent.id);
  if (record.manifest.second && configured.setup_future_usage !== "off_session")
    throw new Error("Future card collection is not configured");
  return invoice;
}
export async function sendFirstInvitation(record: PlanRecord) {
  if (record.manifest.invitationFormat === "upn_only")
    throw new Error("UPN-only obligation must use the club invitation");
  if (record.invitation_channel === "club" || record.bank_reference)
    throw new Error("Use the combined club invitation for this obligation");
  await assertTuitionStripe(record.manifest.mode);
  if (record.cancelled_at || record.first_payment_id)
    throw new Error("Obligation is closed or paid");
  if (Date.now() + 3600_000 >= Date.parse(record.manifest.firstPaymentDeadline))
    throw new Error("Payment deadline is too close or passed");
  if (record.invitation_state === "submitted")
    return {
      invoice: record.first_invoice_id,
      state: "submitted",
      alreadySubmitted: true,
    };
  if (["sending", "uncertain"].includes(record.invitation_state ?? ""))
    throw new Error("Reconcile Stripe delivery before retrying");
  const invoice = await prepareFirstInvitation(record);
  await submitInvitation(record, {
    save: (patch) => patchPlan(record, patch),
    send: async () => {
      await trainingStripe.invoices.sendInvoice(
        invoice.id,
        {},
        { idempotencyKey: `tuition-first-send-${record.id}` },
      );
    },
  });
  return {
    invoice: invoice.id,
    state: "submitted",
    alreadySubmitted: false,
    testEmailSuppressed: record.manifest.mode === "test",
  };
}
export async function invoicePaymentUrl(record: PlanRecord) {
  if (record.manifest.invitationFormat === "upn_only")
    throw new Error("UPN-only obligation has no card payment link");
  if (
    !record.first_invoice_id ||
    record.invitation_state !== "submitted" ||
    record.cancelled_at ||
    record.first_payment_id
  )
    throw new Error("Payment request has not been sent or is closed");
  const invoice = await trainingStripe.invoices.retrieve(
    record.first_invoice_id,
  );
  verifyFirstInvoice(invoice, record);
  if (invoice.status !== "open" || !invoice.hosted_invoice_url)
    throw new Error("Request is not payable");
  return invoice.hosted_invoice_url;
}
export async function cancelFirstInvoice(record: PlanRecord) {
  if (!record.first_invoice_id) return;
  let invoice: Stripe.Invoice;
  try {
    invoice = await trainingStripe.invoices.retrieve(record.first_invoice_id);
  } catch (error) {
    // A draft delete can succeed before its response or DB acknowledgment is lost.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "resource_missing"
    )
      return;
    throw error;
  }
  if (
    objectId(invoice.customer) !== record.customer_id ||
    invoice.metadata?.planId !== record.id ||
    invoice.livemode !== (record.manifest.mode === "live")
  )
    throw new Error("Cancellation request mismatch");
  if (invoice.status === "draft") await trainingStripe.invoices.del(invoice.id);
  else if (invoice.status === "open")
    await trainingStripe.invoices.voidInvoice(invoice.id);
  // Paid documents/payments are never voided, refunded or recreated here.
}
