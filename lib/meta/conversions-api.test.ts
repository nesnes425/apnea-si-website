import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import type Stripe from "stripe";
import { sendMetaTrainingPurchase } from "./conversions-api";

function intent(metadata: Record<string, string>) {
  return {
    id: "pi_training_123",
    amount: 3500,
    currency: "eur",
    created: 1_700_000_000,
    livemode: true,
    metadata,
  } as unknown as Stripe.PaymentIntent;
}

afterEach(() => {
  delete process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  delete process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  delete process.env.META_TEST_EVENT_CODE;
});

describe("sendMetaTrainingPurchase", () => {
  test("does not send without marketing consent", async () => {
    let called = false;
    const result = await sendMetaTrainingPurchase(
      intent({ metaMarketingConsent: "false" }),
      async () => {
        called = true;
        return new Response();
      }
    );

    assert.deepEqual(result, { status: "skipped", reason: "no_consent" });
    assert.equal(called, false);
  });

  test("sends a deduplicated, hashed Purchase event", async () => {
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_FB_PIXEL_ID = "123456789";
    let requestBody: Record<string, unknown> | undefined;
    const result = await sendMetaTrainingPurchase(
      intent({
        metaMarketingConsent: "true",
        customerEmail: " Ana@Example.com ",
        customerPhone: "+386 40 111 222",
        trainingGroupId: "group-1",
        metaFbp: "fb.1.123.456",
        metaClientUserAgent: "Mozilla/5.0 Test Browser",
      }),
      async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
      }
    );

    assert.deepEqual(result, { status: "sent" });
    const data = requestBody?.data as Array<Record<string, unknown>>;
    assert.equal(data[0].event_name, "Purchase");
    assert.equal(data[0].event_id, "pi_training_123");
    assert.equal(data[0].action_source, "website");
    const userData = data[0].user_data as Record<string, string[]>;
    assert.match(userData.em[0], /^[a-f0-9]{64}$/);
    assert.match(userData.ph[0], /^[a-f0-9]{64}$/);
    assert.notEqual(userData.em[0], "ana@example.com");
    assert.equal(userData.client_user_agent, "Mozilla/5.0 Test Browser");
  });

  test("does not mix Stripe test payments into production events", async () => {
    const testIntent = {
      ...intent({ metaMarketingConsent: "true" }),
      livemode: false,
    } as Stripe.PaymentIntent;
    let called = false;
    const result = await sendMetaTrainingPurchase(testIntent, async () => {
      called = true;
      return new Response();
    });

    assert.deepEqual(result, { status: "skipped", reason: "test_mode" });
    assert.equal(called, false);
  });
});
