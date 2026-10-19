import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { brevoWebhookAuthorized, parseDeliveryEvent, deliverySummary, type DeliveryRecord } from "./delivery-model";
import { sendTrackedTuitionEmail } from "./delivery";
import { sendInternalTuitionTest } from "./email-test";
import { BrevoRequestError } from "./client";
import { POST } from "@/app/api/brevo/tuition-webhook/route";
function setEnv(t: TestContext, key: string, value: string) {
  const previous = process.env[key];
  process.env[key] = value;
  t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
}
const id = "b41d5dd2-ff7a-45a6-935a-d08b03f9d525";
const now = Math.floor(Date.now() / 1000);
const raw = { event: "delivered", email: "TEST@example.invalid", "message-id": "<synthetic@brevo>", ts_event: now, tags: [`tuition-email:${id}`] };
const record: DeliveryRecord = { id, plan_id: id, kind: "tuition_combined", recipient: "test@example.invalid", message_id: "synthetic@brevo", submission_state: "submitted", created_at: new Date().toISOString(), submitted_at: new Date().toISOString() };
const email = { to: { email: record.recipient }, subject: "Synthetic", text: "Synthetic", html: "<p>Synthetic</p>" };

test("provider rejection logs only safe diagnostics and cannot be retried with the same ID", async t => {
  for (const [key, value] of Object.entries({ PORTAL_SUPABASE_URL: "https://db.example.invalid", PORTAL_SUPABASE_SERVICE_KEY: "PRIVATE-SERVICE-KEY", BREVO_API_KEY: "PRIVATE-BREVO-KEY", BREVO_FROM_EMAIL: "info@apnea.si", BREVO_FROM_NAME: "Apnea" })) setEnv(t, key, value);
  const logs = t.mock.method(console, "error", () => {});
  let inserted = false, sends = 0, uncertain = false;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).endsWith("/smtp/email")) {
      sends++;
      return Response.json({ code: "unauthorized", message: "PRIVATE-BREVO-KEY rejected for test@example.invalid" }, { status: 401 });
    }
    if (init?.method === "PATCH") { uncertain = true; return Response.json([]); }
    if (inserted) return Response.json({}, { status: 409 });
    inserted = true; return Response.json([]);
  });
  await assert.rejects(() => sendTrackedTuitionEmail(id, null, email), BrevoRequestError);
  await assert.rejects(() => sendTrackedTuitionEmail(id, null, email));
  assert.equal(sends, 1); assert.equal(uncertain, true);
  assert.deepEqual(logs.mock.calls.map(c => c.arguments), [["Tuition email submission failed", { stage: "provider_submission", providerStatus: 401, providerCode: "unauthorized" }]]);
  assert.doesNotMatch(JSON.stringify(logs.mock.calls.map(c => c.arguments)), /PRIVATE|example\.invalid|Synthetic/);
  assert.equal(new BrevoRequestError("private", 400, JSON.stringify({ code: "PRIVATE-BREVO-KEY" })).providerCode, null);
  assert.equal(new BrevoRequestError("private", 502, "not JSON").providerCode, null);
});

test("receipt storage failure is distinguishable from a provider rejection without logging its error", async t => {
  for (const [key, value] of Object.entries({ PORTAL_SUPABASE_URL: "https://db.example.invalid", PORTAL_SUPABASE_SERVICE_KEY: "synthetic", BREVO_API_KEY: "synthetic", BREVO_FROM_EMAIL: "info@apnea.si", BREVO_FROM_NAME: "Apnea" })) setEnv(t, key, value);
  const logs = t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    if (String(url).endsWith("/smtp/email")) return Response.json({ messageId: "<private@brevo>" });
    if (String(url).endsWith("/rpc/tuition_email_submitted")) return Response.json({ message: "PRIVATE database error" }, { status: 503 });
    return Response.json([]);
  });
  await assert.rejects(() => sendTrackedTuitionEmail(id, null, email));
  assert.deepEqual(logs.mock.calls.map(c => c.arguments), [["Tuition email submission failed", { stage: "receipt_storage", providerStatus: null, providerCode: null }]]);
});

test("events normalize IDs, use event time, deduplicate without trusting webhook configuration id", () => {
  const a = parseDeliveryEvent({ ...raw, id: 10 })!;
  const b = parseDeliveryEvent({ ...raw, "message-id": "synthetic@brevo", id: 20 })!;
  assert.equal(a.event_key, b.event_key);
  assert.equal(a.message_id, record.message_id);
  assert.equal(a.recipient, record.recipient);
  assert.equal(a.delivery_id, id);
  assert.equal(parseDeliveryEvent({ ...raw, ts_event: undefined, ts_epoch: now * 1000 })!.occurred_at, a.occurred_at);
  assert.notEqual(parseDeliveryEvent({ ...raw, event: "hard_bounce" })!.event_key, a.event_key);
  assert.equal(parseDeliveryEvent({ event: "opened" }), null);
  assert.throws(() => parseDeliveryEvent({ ...raw, ts_event: undefined }));
  assert.throws(() => parseDeliveryEvent({ ...raw, tags: [...raw.tags, "tuition-email:invalid"] }));
  assert.throws(() => parseDeliveryEvent({ ...raw, "message-id": "bad\r\nheader" }));
});
test("late request/deferred events cannot undo delivery; complaints stay visible and opens prove nothing", () => {
  const delivered = parseDeliveryEvent(raw)!;
  const request = parseDeliveryEvent({ ...raw, event: "request", ts_event: now + 10 })!;
  const delayed = parseDeliveryEvent({ ...raw, event: "soft_bounce", ts_event: now - 10, reason: "temporary" })!;
  for (const events of [[delivered, request, delayed], [request, delayed, delivered]]) {
    const summary = deliverySummary(record, events);
    assert.equal(summary.status, "delivered"); assert.equal(summary.needs_review, false);
    assert.equal(summary.reason, null);
  }
  const complaint = parseDeliveryEvent({ ...raw, event: "spam", ts_event: now + 20 })!;
  assert.equal(deliverySummary(record, [complaint, delivered]).needs_review, true);
  assert.equal(deliverySummary(record, [complaint, delivered]).status, "spam");
  assert.equal(deliverySummary(record, [delayed]).status, "soft_bounce");
  assert.equal(deliverySummary({ ...record, submission_state: "uncertain" }, [delivered]).needs_review, true);
  assert.equal(deliverySummary({ ...record, created_at: "2026-01-01T00:00:00Z" }, []).needs_review, true);
});
test("webhook requires its own strong bearer secret and bounds malformed bodies", async t => {
  setEnv(t, "BREVO_TUITION_WEBHOOK_SECRET", "s".repeat(32));
  assert.equal(brevoWebhookAuthorized(new Request("http://localhost", { headers: { authorization: `Bearer ${"s".repeat(32)}` } })), true);
  assert.equal(brevoWebhookAuthorized(new Request("http://localhost?secret=" + "s".repeat(32))), false);
  const req = (body: string, auth = true) => new Request("http://localhost", { method: "POST", body, headers: auth ? { authorization: `Bearer ${"s".repeat(32)}` } : {} });
  assert.equal((await POST(req("{}", false))).status, 401);
  assert.equal((await POST(req("invalid"))).status, 400);
  assert.equal((await POST(req("x".repeat(128001)))).status, 413);
  assert.equal((await POST(req(JSON.stringify({ event: "opened" })))).status, 200);
  t.mock.method(globalThis, "fetch", async () => new Response("{}", { status: 503 }));
  assert.equal((await POST(req(JSON.stringify(raw)))).status, 503);
});
test("send stores ID/tag and a persistent lock; timeouts and replay never call Brevo twice", async t => {
  for (const [key, value] of Object.entries({ PORTAL_SUPABASE_URL: "https://db.example.invalid", PORTAL_SUPABASE_SERVICE_KEY: "synthetic", BREVO_API_KEY: "synthetic", BREVO_FROM_EMAIL: "info@apnea.si", BREVO_FROM_NAME: "Apnea" })) setEnv(t, key, value);
  let inserted = false, sends = 0, submitted = false, uncertain = false;
  let timeout = false;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url), body = JSON.parse(String(init?.body ?? "{}"));
    if (path.endsWith("/smtp/email")) {
      sends++;
      assert.deepEqual(body.tags, [`tuition-email:${id}`]);
      assert.equal(body.replyTo, undefined);
      if (timeout) throw new Error("accepted, response lost");
      return Response.json({ messageId: "<synthetic@brevo>" });
    }
    if (path.endsWith("/tuition_email_deliveries") && init?.method === "POST") {
      if (inserted) return Response.json({}, { status: 409 });
      inserted = true; return Response.json([{ id }]);
    }
    if (path.endsWith("/rpc/tuition_email_submitted")) { submitted = true; assert.equal(body.provider_id, "synthetic@brevo"); return Response.json(null); }
    if (init?.method === "PATCH") { uncertain = true; return Response.json([]); }
    throw new Error("Unexpected network request");
  });
  await sendTrackedTuitionEmail(id, id, email);
  assert.equal(submitted, true);
  await assert.rejects(() => sendTrackedTuitionEmail(id, id, email));
  assert.equal(sends, 1);
  inserted = false; timeout = true;
  await assert.rejects(() => sendTrackedTuitionEmail(id, id, email));
  await assert.rejects(() => sendTrackedTuitionEmail(id, id, email));
  assert.equal(sends, 2); assert.equal(uncertain, true);
});
test("internal test cannot send to a member or run with disabled/missing configuration", async t => {
  setEnv(t, "TUITION_EMAIL_TEST_ENABLED", "true");
  setEnv(t, "TUITION_EMAIL_TEST_RECIPIENTS", "internal@example.invalid");
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("No network allowed"); });
  await assert.rejects(() => sendInternalTuitionTest({ id, recipient: "member@example.invalid" }), /not enabled/);
  setEnv(t, "TUITION_EMAIL_TEST_ENABLED", "false");
  await assert.rejects(() => sendInternalTuitionTest({ id, recipient: "internal@example.invalid" }), /not enabled/);
  assert.equal(fetch.mock.callCount(), 0);
});
test("approved internal test uses final template, safe PDF, real sender/reply-to and no financial APIs", async t => {
  for (const [key, value] of Object.entries({ TUITION_EMAIL_TEST_ENABLED: "true", TUITION_EMAIL_TEST_RECIPIENTS: "internal@example.invalid", BREVO_TUITION_WEBHOOK_SECRET: "s".repeat(32), PORTAL_SUPABASE_URL: "https://db.example.invalid", PORTAL_SUPABASE_SERVICE_KEY: "synthetic", BREVO_API_KEY: "synthetic", BREVO_FROM_EMAIL: "info@apnea.si", BREVO_FROM_NAME: "Apnea" })) setEnv(t, key, value);
  let sends = 0;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    if (String(url).endsWith("/smtp/email")) {
      sends++;
      assert.equal(body.sender.email, "info@apnea.si");
      assert.equal(body.replyTo.email, "info@apnea.si");
      assert.deepEqual(body.to, [{ email: "internal@example.invalid" }]);
      assert.match(body.subject, /^\[TEST/);
      assert.match(body.textContent, /VZOREC – NI ZA PLAČILO/);
      assert.match(body.textContent, /585,00/);
      assert.match(body.textContent, /\[Stripe povezava za dva obroka\]/);
      assert.doesNotMatch(body.htmlContent, /https:\/\/invoice\.stripe\.com/);
      assert.equal(body.attachment.length, 1);
      assert.equal(Buffer.from(body.attachment[0].content, "base64").subarray(0, 5).toString(), "%PDF-");
      return Response.json({ messageId: "<synthetic@brevo>" });
    }
    assert.ok(String(url).startsWith("https://db.example.invalid/rest/v1/tuition_email_deliveries") || String(url).endsWith("/rpc/tuition_email_submitted"));
    return Response.json([]);
  });
  await sendInternalTuitionTest({ id, recipient: "internal@example.invalid" });
  assert.equal(sends, 1);
});
test("valid webhook batch persists minimal evidence and returns no recipient data", async t => {
  setEnv(t, "BREVO_TUITION_WEBHOOK_SECRET", "s".repeat(32));
  setEnv(t, "PORTAL_SUPABASE_URL", "https://db.example.invalid");
  setEnv(t, "PORTAL_SUPABASE_SERVICE_KEY", "synthetic");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    calls++;
    assert.ok(String(url).endsWith("/rpc/tuition_email_event"));
    const payload = JSON.parse(String(init?.body)).payload;
    assert.equal(payload.message_id, "synthetic@brevo");
    assert.equal(payload.subject, undefined);
    assert.equal(payload.html, undefined);
    return Response.json(true);
  });
  const response = await POST(new Request("http://localhost", { method: "POST", headers: { authorization: `Bearer ${"s".repeat(32)}` }, body: JSON.stringify([raw, { ...raw, event: "request", subject: "private" }]) }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { received: true });
  assert.equal(calls, 2);
});
