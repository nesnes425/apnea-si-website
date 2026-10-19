import { BrevoRequestError, sendTransactionalEmailWithReceipt, type TransactionalEmail } from "./client";
import { tuitionDb } from "@/lib/tuition/store";
import { deliverySummary, deliveryTag, normalizeMessageId, type DeliveryEvent, type DeliveryRecord } from "./delivery-model";

export async function sendTrackedTuitionEmail(id: string, planId: string | null, email: TransactionalEmail) {
  // Inserting BEFORE the provider call is the durable, unique send lock. An existing
  // row always blocks a resend, including timeouts and lost DB acknowledgments.
  const recipient = email.to.email.trim().toLowerCase();
  await tuitionDb("tuition_email_deliveries", "POST", {
    id, plan_id: planId, kind: planId ? "tuition_combined" : "tuition_test", recipient,
  });
  let stage: "provider_submission" | "receipt_storage" = "provider_submission";
  try {
    // Brevo requires a UUID; a prefixed key exceeds its accepted length.
    const result = await sendTransactionalEmailWithReceipt({ ...email, tags: [deliveryTag(id)], idempotencyKey: id });
    const messageId = normalizeMessageId(result.messageId);
    stage = "receipt_storage";
    await tuitionDb("rpc/tuition_email_submitted", "POST", { target_id: id, provider_id: messageId });
    return { id, messageId };
  } catch (error) {
    // Never log the raw error: it may contain message bodies or recipient data.
    console.error("Tuition email submission failed", {
      stage,
      providerStatus: error instanceof BrevoRequestError ? error.status : null,
      providerCode: error instanceof BrevoRequestError ? error.providerCode : null,
    });
    // Never erase webhook evidence or the original submission time.
    await tuitionDb(`tuition_email_deliveries?id=eq.${id}&submission_state=eq.sending`, "PATCH", { submission_state: "uncertain" });
    throw error;
  }
}
export async function recordDeliveryEvent(event: DeliveryEvent) {
  return tuitionDb<boolean>("rpc/tuition_email_event", "POST", { payload: event });
}
export async function getEmailDelivery(filter: { id: string } | { planId: string }) {
  const query = "id" in filter ? `id=eq.${encodeURIComponent(filter.id)}` : `plan_id=eq.${encodeURIComponent(filter.planId)}`;
  const records = await tuitionDb<DeliveryRecord[]>(`tuition_email_deliveries?${query}&limit=1`);
  if (!records.length) return null;
  const record = records[0];
  const events = await tuitionDb<DeliveryEvent[]>(`tuition_email_events?delivery_id=eq.${record.id}&order=occurred_at.asc&limit=1000`);
  return deliverySummary(record, events);
}
