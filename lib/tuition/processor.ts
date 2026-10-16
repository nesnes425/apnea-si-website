import type { TuitionPlan } from "./plan";
import type { PaymentRecord } from "./store";
import { euro } from "./plan";

type Invoice = {
  invoiceId: number;
  number: string;
  pdf: { fileName: string; contentBase64: string };
};
export type TuitionProcessingDeps = {
  save: (patch: Partial<PaymentRecord>) => Promise<void>;
  issue: () => Promise<Invoice>;
  send: (invoice: Invoice) => Promise<void>;
};

// No dependency here can charge a card. Reconciliation resumes the invoice/PDF
// stage, never Checkout or a Stripe payment request.
export async function processTuitionPayment(
  plan: TuitionPlan,
  payment: PaymentRecord,
  deps: TuitionProcessingDeps,
) {
  if (plan.mode === "test") {
    await deps.save({
      invoice_state: "test_skipped",
      email_state: "test_skipped",
      error: null,
    });
    return "test_skipped";
  }
  if (payment.email_state === "sent") return "sent";
  if (["sending", "uncertain"].includes(payment.email_state)) {
    await deps.save({
      email_state: "uncertain",
      error: "Check Brevo delivery before authorizing any resend",
    });
    return "uncertain";
  }
  const invoice = await deps.issue();
  // Persist BEFORE send. An accepted email followed by a timeout/DB failure must
  // never be resent automatically after the provider's short deduplication TTL.
  await deps.save({ email_state: "sending" });
  try {
    await deps.send(invoice);
    await deps.save({ email_state: "sent", error: null });
  } catch (error) {
    await deps.save({
      email_state: "uncertain",
      error: "Brevo delivery uncertain; reconcile provider log before resend",
    });
    throw error;
  }
  return "sent";
}

export function tuitionReceiptText(
  plan: TuitionPlan,
  payment: PaymentRecord,
  invoiceNumber: string,
) {
  return `Pozdravljeni,\n\nprejeli smo plačilo ${payment.instalment}. obroka vadnine v višini ${euro(payment.amount_cents)}. Udeleženec: ${plan.participant}. V priponki je račun ${invoiceNumber}.\n\nLep pozdrav,\nŠportno društvo Apnea Slovenija`;
}
