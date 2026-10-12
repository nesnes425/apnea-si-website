import { test } from "node:test";
import assert from "node:assert/strict";
import { sendLoginCode } from "./login-code";

test("OTP sends to a normalized address without allowing registration", async () => {
  process.env.PORTAL_SUPABASE_URL = "https://example.invalid";
  process.env.PORTAL_SUPABASE_ANON_KEY = "test";
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(String(init?.body)), { email: "coach@example.invalid", create_user: false });
    return Response.json({});
  };
  try {
    const result = await sendLoginCode(" COACH@example.invalid ");
    assert.equal(result.error, undefined);
    assert.equal(result.retryAfter, 60);
  } finally { globalThis.fetch = original; }
});

test("network and provider outages do not claim that an OTP was delivered", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [500, 503]) {
      globalThis.fetch = async () => Response.json({}, { status });
      const result = await sendLoginCode("coach@example.invalid");
      assert.ok(result.error);
      assert.equal(result.message, undefined);
    }
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.ok((await sendLoginCode("coach@example.invalid")).error);
  } finally { globalThis.fetch = original; }
});

test("rate limits have a retry delay, including during account confirmation", async () => {
  const original = globalThis.fetch;
  try {
    for (const confirmation of [false, true]) {
      globalThis.fetch = async (url) => Response.json({}, {
        status: confirmation && String(url).endsWith("/otp") ? 422 : 429,
      });
      const result = await sendLoginCode("coach@example.invalid");
      assert.equal(result.retryAfter, 60);
      assert.ok(result.error);
      assert.equal(result.message, undefined);
    }
  } finally { globalThis.fetch = original; }
});

test("confirmation fallback preserves the same response for unknown addresses", async () => {
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls++;
      if (calls % 2 === 1) return Response.json({}, { status: 422 });
      assert.equal(JSON.parse(String(init?.body)).type, "signup");
      return Response.json({});
    };
    const known = await sendLoginCode("coach@example.invalid");
    assert.equal(calls, 2);
    globalThis.fetch = async (url) => Response.json({}, { status: String(url).endsWith("/otp") ? 422 : 400 });
    assert.deepEqual(await sendLoginCode("unknown@example.invalid"), known);
    for (const code of ["signup_disabled", "user_not_found"]) {
      globalThis.fetch = async () => Response.json({ error_code: code }, { status: 400 });
      assert.deepEqual(await sendLoginCode("unknown@example.invalid"), known);
    }
    globalThis.fetch = async (url) => Response.json({}, { status: String(url).endsWith("/otp") ? 422 : 503 });
    assert.ok((await sendLoginCode("coach@example.invalid")).error);
  } finally { globalThis.fetch = original; }
});
