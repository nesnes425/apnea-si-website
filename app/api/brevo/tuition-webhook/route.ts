import { NextResponse } from "next/server";
import { brevoWebhookAuthorized, parseDeliveryEvent } from "@/lib/brevo/delivery-model";
import { recordDeliveryEvent } from "@/lib/brevo/delivery";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(request: Request) {
  if (!brevoWebhookAuthorized(request)) return reply({ error: "Unauthorized" }, 401);
  // Limit bytes while streaming, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply({ error: "Missing body" }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128_000) { await reader.cancel(); return reply({ error: "Too large" }, 413); }
      chunks.push(value);
    }
  } catch { return reply({ error: "Invalid body" }, 400); }
  let events;
  try {
    const raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const batch = Array.isArray(raw) ? raw : [raw];
    if (!batch.length || batch.length > 50) return reply({ error: "Invalid batch" }, 400);
    events = batch.map(parseDeliveryEvent).filter(e => e !== null);
  } catch { return reply({ error: "Invalid event" }, 400); }
  try {
    for (const event of events) await recordDeliveryEvent(event);
    return reply({ received: true });
  } catch {
    // Let Brevo retry; earlier committed events in this batch are idempotent.
    return reply({ error: "Delivery evidence pending" }, 503);
  }
}
