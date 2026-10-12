import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchPortalComment, dispatchPendingPortalComments } from "./portal-comment";
import { GET } from "../../app/api/portal/comments/route";

test("comment dispatch only sends an atomically claimed message to the fixed recipient", async () => {
  Object.assign(process.env, {
    PORTAL_EMAIL_ENABLED: "true", PORTAL_SUPABASE_URL: "https://example.invalid",
    PORTAL_SUPABASE_ANON_KEY: "test", PORTAL_SUPABASE_SERVICE_KEY: "service-test",
    BREVO_API_KEY: "test", BREVO_FROM_EMAIL: "sender@example.invalid", BREVO_FROM_NAME: "Test",
  });
  const original = globalThis.fetch;
  const marked: string[] = [];
  let sends = 0;
  let claimed = false;
  globalThis.fetch = async (url, init) => {
    const path = String(url);
    if (path.endsWith("portal_claim_mail")) {
      if (claimed) return Response.json([]);
      claimed = true;
      return Response.json([{ id: "mail-1", subject: "Coach, group, date", body: "Synthetic comment" }]);
    }
    const body = JSON.parse(String(init?.body));
    if (path.includes("api.brevo.com")) {
      sends++;
      assert.deepEqual(body.to, [{ email: "info@apnea.si" }]);
      assert.equal(body.subject, "Coach, group, date");
      assert.equal(body.textContent, "Synthetic comment");
      assert.equal(body.headers.idempotencyKey, "mail-1");
      return Response.json({ messageId: "synthetic" }, { status: 201 });
    }
    marked.push(body.outcome);
    return new Response(null, { status: 204 });
  };
  try {
    assert.equal(await dispatchPortalComment("session-1"), "sent");
    assert.equal(await dispatchPortalComment("session-1"), "none");
    assert.equal(sends, 1);
    assert.deepEqual(marked, ["sent"]);
  } finally { globalThis.fetch = original; }
});

test("provider rejection is failed; timeout and 5xx remain uncertain without resending", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [401, 429, 503, 0]) {
      let sends = 0;
      let marked = "";
      globalThis.fetch = async (url, init) => {
        if (String(url).endsWith("portal_claim_mail")) return Response.json([{ id: "mail", subject: "Test", body: "Test" }]);
        if (String(url).includes("api.brevo.com")) {
          sends++;
          if (!status) throw new Error("timeout");
          return Response.json({}, { status });
        }
        marked = JSON.parse(String(init?.body)).outcome;
        return new Response(null, { status: 204 });
      };
      assert.equal(await dispatchPortalComment("session"), status && status < 500 ? "failed" : "uncertain");
      assert.equal(marked, status && status < 500 ? "failed" : "uncertain");
      assert.equal(sends, 1);
    }
  } finally { globalThis.fetch = original; }
});

test("scheduled recovery requires authorization, configuration, and only selects pending mail", async () => {
  const original = globalThis.fetch;
  process.env.CRON_SECRET = "test-secret";
  try {
    globalThis.fetch = async () => { throw new Error("No request expected"); };
    assert.equal((await GET(new Request("http://localhost/api/portal/comments"))).status, 401);
    process.env.PORTAL_EMAIL_ENABLED = "false";
    assert.equal((await GET(new Request("http://localhost/api/portal/comments", { headers: { authorization: "Bearer test-secret" } }))).status, 503);
    process.env.PORTAL_EMAIL_ENABLED = "true";
    globalThis.fetch = async (url) => {
      assert.match(String(url), /status=eq.pending/);
      return Response.json([]);
    };
    assert.deepEqual(await dispatchPendingPortalComments(), {});
  } finally { globalThis.fetch = original; }
});
