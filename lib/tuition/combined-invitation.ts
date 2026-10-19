import {siteConfig} from "@/lib/config";
import {sendTrackedTuitionEmail} from "@/lib/brevo/delivery";
import {bankReference} from "./bank-model";
import {assertBankEnabled} from "./bank";
import {combinedInvitation, upnDetails} from "./combined-template";
import {prepareFirstInvitation, submitInvitation} from "./invitation";
import {patchPlan, type PlanRecord} from "./store";
import {tuitionUpnPdf} from "./upn-pdf";

export async function prepareCombinedInvitation(record: PlanRecord) {
  assertBankEnabled();
  if (!record.manifest.second || record.first_payment_flow !== "stripe_invoice" || record.checkout_id)
    throw new Error("Combined invitation needs a native two-instalment plan");
  if (record.invitation_state !== "not_sent") throw new Error("Invitation already submitted or needs delivery review");
  if (record.cancelled_at || record.first_payment_id || record.bank_state) throw new Error("Plan is closed or already paid");
  const upn = upnDetails(record.manifest);
  if (record.bank_reference && (record.bank_reference !== bankReference(record.id) || record.bank_iban !== upn.iban || record.bank_amount_cents !== upn.amountCents))
    throw new Error("Saved bank offer differs from the approved obligation");
  // Store the immutable offer before exposing its reference or any payment link.
  await patchPlan(record, {invitation_channel:"club", bank_reference: upn.reference, bank_iban: upn.iban, bank_amount_cents: upn.amountCents});
  const invoice = await prepareFirstInvitation(record);
  if (!invoice.hosted_invoice_url) throw new Error("Hosted Stripe URL missing");
  const message = combinedInvitation(record.manifest, invoice.hosted_invoice_url);
  const pdf = await tuitionUpnPdf(record.manifest);
  return {...message, invoice: invoice.id, attachment: {name:"UPN-vadnina-cela-sezona.pdf",contentBase64:pdf.toString("base64")}};
}
export async function sendCombinedInvitation(record: PlanRecord) {
  assertBankEnabled();
  if (record.invitation_state === "submitted") {
    if (record.invitation_channel !== "club") throw new Error("A Stripe invitation was already sent; do not send another");
    return {state:"submitted",alreadySubmitted:true};
  }
  if (process.env.TUITION_EMAIL_TRACKING_READY !== "true" || (process.env.BREVO_TUITION_WEBHOOK_SECRET?.length ?? 0) < 32)
    throw new Error("Verify the delivery webhook with an internal test before member invitations");
  if (record.manifest.mode !== "live") throw new Error("Test plans render previews only; no real email");
  if (process.env.BREVO_FROM_EMAIL?.trim().toLowerCase() !== siteConfig.email)
    throw new Error("Combined invitation must be sent from info@apnea.si");
  const message = await prepareCombinedInvitation(record);
  await submitInvitation(record, {
    save: patch => patchPlan(record, patch),
    send: async () => { await sendTrackedTuitionEmail(record.id, record.id, {
      to: {email: record.manifest.payer.email, name:record.manifest.payer.name},
      subject: message.subject, text:message.text, html:message.html,
      replyTo:{email:siteConfig.email, name:siteConfig.tuitionBank.name},
      attachments:[message.attachment], idempotencyKey:`tuition-combined-${record.id}`,
    }); },
  });
  return {state:"submitted",alreadySubmitted:false,invoice:message.invoice};
}
