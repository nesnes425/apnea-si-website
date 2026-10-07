import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
import { sessionCookieOptions } from "./session-cookies";

test("refresh rotates both cookies and forwards renewed identity to the current request", async () => {
  process.env.PORTAL_SUPABASE_URL = "https://example.invalid";
  process.env.PORTAL_SUPABASE_ANON_KEY = "test-key";
  const original = globalThis.fetch;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const path = String(input);
    paths.push(path);
    if (path.endsWith("/user")) return Response.json({}, { status: 401 });
    if (path.includes("grant_type=refresh_token"))
      return Response.json({
        access_token: "new-access",
        refresh_token: "new-refresh",
      });
    return Response.json({
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      remembered: true,
    });
  };
  try {
    const result = await proxy(
      new NextRequest("http://localhost/trenerji", {
        headers: {
          cookie: "apnea-portal-session=old; apnea-portal-refresh=refresh",
        },
      }),
    );
    assert.equal(
      result.cookies.get("apnea-portal-session")?.value,
      "new-access",
    );
    assert.equal(
      result.cookies.get("apnea-portal-refresh")?.value,
      "new-refresh",
    );
    assert.match(
      result.headers.get("x-middleware-request-cookie") || "",
      /new-access/,
    );
    assert.equal(paths.length, 3);
    assert.equal(result.headers.get("Cache-Control"), "private, no-store");
  } finally {
    globalThis.fetch = original;
  }
});
test("expired policy clears cookies; network outages do not discard remembered login", async () => {
  const original = globalThis.fetch;
  const request = () =>
    new NextRequest("http://localhost/trenerji", {
      headers: {
        cookie: "apnea-portal-session=access; apnea-portal-refresh=refresh",
      },
    });
  try {
    globalThis.fetch = async (input) =>
      String(input).endsWith("/user")
        ? Response.json({ id: "id" })
        : Response.json({ code: "P0001" }, { status: 400 });
    const expired = await proxy(request());
    assert.equal(expired.cookies.get("apnea-portal-refresh")?.maxAge, 0);
    globalThis.fetch = async () => {
      throw Error("offline");
    };
    const offline = await proxy(request());
    assert.equal(offline.status, 503);
    assert.equal(offline.cookies.getAll().length, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("unremembered login uses session cookies and persistent expiry is bounded", () => {
  assert.equal(
    "maxAge" in
      sessionCookieOptions({ remembered: false, expires_at: "2030-01-01" }),
    false,
  );
  assert.equal(
    sessionCookieOptions(
      { remembered: true, expires_at: "2026-01-02T00:00:00Z" },
      Date.parse("2026-01-01T00:00:00Z"),
    ).maxAge,
    86400,
  );
});
