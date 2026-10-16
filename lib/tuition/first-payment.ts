import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import { TUITION_TYPE, invoiceConsentHash } from "./plan";
import { verifyFirstInvoice } from "./invitation";
import {
  recordFirstPayment,
  type PlanRecord,
  type PaymentRecord,
} from "./store";

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

export async function acceptFirstCheckout(
  plan: PlanRecord,
  session: Stripe.Checkout.Session,
  paidAt: number,
) {
  if (plan.first_payment_flow === "stripe_invoice")
    throw new Error(
      "Invoice obligations cannot collect a second first payment through Checkout",
    );
  if (
    session.id !== plan.checkout_id ||
    session.metadata?.type !== TUITION_TYPE ||
    session.metadata.planId !== plan.id ||
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
    intent.metadata.planId !== plan.id ||
    intent.metadata.type !== TUITION_TYPE ||
    (plan.manifest.second && intent.setup_future_usage !== "off_session")
  )
    throw new Error("Payment metadata/card agreement mismatch");
  if (plan.first_payment_id && plan.first_payment_id !== intentId)
    throw new Error(
      "A distinct first payment already exists; reconcile duplicate",
    );
  await recordFirstPayment(
    plan,
    {
      id: intentId,
      plan_id: plan.id,
      instalment: 1,
      amount_cents: intent.amount_received,
      paid_at: new Date(paidAt * 1000).toISOString(),
    },
    {
      first_payment_id: intentId,
      checkout_id: session.id,
      consent_session_id: session.id,
    },
  );
}

export function verifySubmittedFirstInvoice(
  plan: PlanRecord,
  invoice: Stripe.Invoice,
) {
  if (
    plan.first_payment_flow !== "stripe_invoice" ||
    plan.first_invoice_id !== invoice.id ||
    !plan.invitation_requested_at ||
    !["submitted", "sending", "uncertain"].includes(plan.invitation_state ?? "")
  )
    throw new Error(
      "First invoice was not prepared and submitted for this plan",
    );
  verifyFirstInvoice(invoice, plan);
}

export async function acceptFirstInvoice(
  plan: PlanRecord,
  invoice: Stripe.Invoice,
  paidAt: number,
) {
  verifySubmittedFirstInvoice(plan, invoice);
  if (invoice.status !== "paid")
    throw new Error("First request has not been paid");
  const intent = await paidInvoiceIntent(invoice.id);
  verifyPaidIntent(intent, {
    amountCents: plan.manifest.first.amountCents,
    customerId: plan.customer_id!,
    live: plan.manifest.mode === "live",
  });
  if (
    intent.metadata.planId !== plan.id ||
    intent.metadata.type !== TUITION_TYPE ||
    intent.metadata.instalment !== "1" ||
    intent.metadata.consent_hash !== invoiceConsentHash(plan.manifest) ||
    (plan.manifest.second && intent.setup_future_usage !== "off_session")
  )
    throw new Error("First payment/card authorization mismatch");
  if (plan.manifest.second) {
    const pm = objectId(intent.payment_method);
    if (!pm) throw new Error("Missing saved card");
    const card = await trainingStripe.paymentMethods.retrieve(pm);
    if (card.type !== "card" || objectId(card.customer) !== plan.customer_id)
      throw new Error(
        "Second-instalment card is not attached to the approved customer",
      );
  }
  if (plan.first_payment_id && plan.first_payment_id !== intent.id)
    throw new Error("A different first payment already exists");
  await recordFirstPayment(
    plan,
    {
      id: intent.id,
      plan_id: plan.id,
      instalment: 1,
      amount_cents: intent.amount_received,
      paid_at: new Date(
        (invoice.status_transitions.paid_at ?? paidAt) * 1000,
      ).toISOString(),
    },
    {
      first_payment_id: intent.id,
      consent_invoice_id: invoice.id,
      collection_error: null,
    },
  );
}

export async function paidInvoiceIntent(invoiceId: string) {
  const payments = await trainingStripe.invoicePayments.list({
    invoice: invoiceId,
    limit: 100,
  });
  const paid = payments.data.filter((p) => p.status === "paid");
  if (
    payments.has_more ||
    paid.length !== 1 ||
    paid[0].payment.type !== "payment_intent" ||
    !paid[0].payment.payment_intent
  )
    throw new Error("Invoice has no single verified Stripe card payment");
  return trainingStripe.paymentIntents.retrieve(
    objectId(paid[0].payment.payment_intent)!,
  );
}

// Old split writes are repaired only after re-reading the provider's payment and
// consent evidence. A missing/unverifiable source stays pending for operator review.
export async function recoverFirstPayment(
  plan: PlanRecord,
  payments: PaymentRecord[],
) {
  const first = payments.find((p) => p.instalment === 1);
  if (!first) return;
  const consent =
    plan.first_payment_flow === "stripe_invoice"
      ? plan.consent_invoice_id
      : plan.consent_session_id;
  if (plan.first_payment_id === first.id && consent) return;
  if (plan.first_payment_flow === "stripe_invoice" && plan.first_invoice_id) {
    const invoice = await trainingStripe.invoices.retrieve(
      plan.first_invoice_id,
    );
    const intent = await paidInvoiceIntent(invoice.id);
    if (intent.id !== first.id)
      throw new Error("Recovered invoice payment mismatch");
    await acceptFirstInvoice(plan, invoice, Date.parse(first.paid_at) / 1000);
  } else if (plan.first_payment_flow !== "stripe_invoice" && plan.checkout_id) {
    const session = await trainingStripe.checkout.sessions.retrieve(
      plan.checkout_id,
    );
    if (objectId(session.payment_intent) !== first.id)
      throw new Error("Recovered checkout payment mismatch");
    await acceptFirstCheckout(plan, session, Date.parse(first.paid_at) / 1000);
  } else
    throw new Error(
      "Missing first-payment consent evidence; reconcile before continuing",
    );
}
