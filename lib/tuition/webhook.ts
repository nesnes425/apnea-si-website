import {
  acceptFirstCheckout,
  acceptFirstInvoice,
  paidInvoiceIntent,
  verifyPaidIntent,
  verifySubmittedFirstInvoice,
} from "./first-payment";
export { paidInvoiceIntent, verifyPaidIntent } from "./first-payment";
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
      await acceptFirstCheckout(plan, session, event.created);
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
  if (
    invoice.metadata?.type === TUITION_TYPE &&
    invoice.metadata.instalment === "1"
  ) {
    const id = z.uuid().parse(invoice.metadata.planId);
    const plan = await claimPlan(id);
    try {
      await assertTuitionStripe(plan.manifest.mode);
      verifySubmittedFirstInvoice(plan, invoice);
      if (
        event.type === "invoice.payment_failed" ||
        event.type === "invoice.payment_action_required"
      ) {
        await patchPlan(plan, {
          collection_error:
            invoice.status === "paid"
              ? null
              : "First payment needs attention; inspect the existing Stripe invoice",
        });
        return true;
      }
      await acceptFirstInvoice(plan, invoice, event.created);
    } finally {
      await releasePlan(plan);
    }
    const result = await processTuitionPlan(id);
    if (result.problems.length)
      throw new Error("Tuition integration pending reconciliation");
    return true;
  }
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
  const intent = await paidInvoiceIntent(invoice.id);
  const intentId = intent.id;
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
