import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const deliveryEvents = ["request", "delivered", "deferred", "soft_bounce", "hard_bounce", "blocked", "invalid_email", "error", "spam", "unsubscribed"] as const;
export type DeliveryEvent = {
  event_key: string;
  delivery_id: string | null;
  message_id: string;
  recipient: string;
  event: typeof deliveryEvents[number];
  occurred_at: string;
  reason: string | null;
};
export type DeliveryRecord = {
  id: string;
  plan_id: string | null;
  kind: "tuition_combined" | "tuition_test";
  recipient: string;
  message_id: string | null;
  submission_state: "sending" | "submitted" | "uncertain";
  created_at: string;
  submitted_at: string | null;
};
export function normalizeMessageId(value: string) {
  const id = value.trim().replace(/^<([^<>]+)>$/, "$1");
  if (!id || id.length > 998 || /[\s<>]/.test(id)) throw new Error("Invalid message ID");
  return id;
}
export function deliveryTag(id: string) { return `tuition-email:${z.uuid().parse(id)}`; }
export function brevoWebhookAuthorized(request: Request) {
  const secret = process.env.BREVO_TUITION_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return false;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function parseDeliveryEvent(input: unknown): DeliveryEvent | null {
  const base = z.object({ event: z.string() }).parse(input);
  // Opens/clicks and unrelated event types are not evidence of delivery or reading.
  if (!(deliveryEvents as readonly string[]).includes(base.event)) return null;
  const p = z.object({
    event: z.enum(deliveryEvents), email: z.email().max(320),
    "message-id": z.string().max(1000),
    ts_event: z.number().int().nonnegative().optional(),
    ts_epoch: z.number().int().nonnegative().optional(),
    tags: z.array(z.string().max(200)).max(100).optional(),
    reason: z.string().max(4000).optional(),
  }).parse(input);
  // ts_epoch is inconsistently documented in seconds/milliseconds. ts_event is seconds.
  const ms = p.ts_event !== undefined ? p.ts_event * 1000
    : p.ts_epoch !== undefined ? p.ts_epoch * (p.ts_epoch < 1e12 ? 1000 : 1) : NaN;
  if (!Number.isFinite(ms) || ms < Date.UTC(2000, 0) || ms > Date.now() + 86400_000)
    throw new Error("Invalid event time");
  const tags = [...new Set((p.tags ?? []).filter(t => t.startsWith("tuition-email:")))];
  if (tags.length > 1) throw new Error("Ambiguous delivery tag");
  const id = tags.length ? z.uuid().parse(tags[0].slice("tuition-email:".length)) : null;
  const messageId = normalizeMessageId(p["message-id"]);
  const recipient = p.email.toLowerCase();
  const occurredAt = new Date(ms).toISOString();
  return {
    event_key: createHash("sha256").update(JSON.stringify([messageId, recipient, p.event, occurredAt])).digest("hex"),
    delivery_id: id, message_id: messageId, recipient, event: p.event,
    occurred_at: occurredAt, reason: p.reason?.slice(0, 500) ?? null,
  };
}
export function deliverySummary(record: DeliveryRecord, events: DeliveryEvent[]) {
  const ordered = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.event.localeCompare(b.event));
  const terminal = ordered.filter(e => ["spam", "unsubscribed", "hard_bounce", "blocked", "invalid_email", "error"].includes(e.event));
  const delivered = ordered.find(e => e.event === "delivered");
  const delayed = ordered.filter(e => ["deferred", "soft_bounce"].includes(e.event)).at(-1);
  const failure = terminal.at(-1);
  const status = failure?.event ?? (delivered ? "delivered" : delayed?.event ?? (ordered.some(e => e.event === "request") ? "sent" : record.submission_state));
  const stale = !delivered && !failure && Date.now() - Date.parse(record.created_at) > 86400_000;
  return {
    ...record, status, delivered_at: delivered?.occurred_at ?? null,
    last_event_at: ordered.at(-1)?.occurred_at ?? null,
    reason: (failure ?? (!delivered ? delayed : undefined))?.reason ?? null,
    needs_review: Boolean(failure || (!delivered && delayed) || stale || record.submission_state === "uncertain" || record.submission_state === "sending"),
    events: ordered,
  };
}
