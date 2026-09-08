import { createHash } from "node:crypto";
import type Stripe from "stripe";

const DEFAULT_GRAPH_API_VERSION = "v23.0";
const TRAINING_SIGNUP_URL = "https://www.apnea.si/treningi/prijava";

type FetchLike = typeof fetch;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizedPhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export type MetaPurchaseResult =
  | {
      status: "skipped";
      reason: "no_consent" | "not_configured" | "test_mode";
    }
  | { status: "sent" };

export async function sendMetaTrainingPurchase(
  intent: Stripe.PaymentIntent,
  fetchImpl: FetchLike = fetch
): Promise<MetaPurchaseResult> {
  if (intent.metadata.metaMarketingConsent !== "true") {
    return { status: "skipped", reason: "no_consent" };
  }

  const testEventCode = process.env.META_TEST_EVENT_CODE;
  if (!intent.livemode && !testEventCode) {
    return { status: "skipped", reason: "test_mode" };
  }

  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { status: "skipped", reason: "not_configured" };
  }

  const email = intent.metadata.customerEmail;
  const phone = intent.metadata.customerPhone;
  const userData = {
    ...(email ? { em: [sha256(normalizedEmail(email))] } : {}),
    ...(phone ? { ph: [sha256(normalizedPhone(phone))] } : {}),
    ...(intent.metadata.metaFbp ? { fbp: intent.metadata.metaFbp } : {}),
    ...(intent.metadata.metaFbc ? { fbc: intent.metadata.metaFbc } : {}),
    ...(intent.metadata.metaClientUserAgent
      ? { client_user_agent: intent.metadata.metaClientUserAgent }
      : {}),
    external_id: [sha256(intent.id)],
  };
  const graphVersion =
    process.env.META_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;
  const response = await fetchImpl(
    `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_time: intent.created || Math.floor(Date.now() / 1000),
            event_id: intent.id,
            action_source: "website",
            event_source_url: TRAINING_SIGNUP_URL,
            user_data: userData,
            custom_data: {
              currency: intent.currency.toUpperCase(),
              value: intent.amount / 100,
              content_name: "training_membership",
              content_type: "product",
              content_ids: [intent.metadata.trainingGroupId],
            },
          },
        ],
        ...(testEventCode ? { test_event_code: testEventCode } : {}),
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Meta Conversions API returned ${response.status}: ${details.slice(0, 300)}`
    );
  }

  return { status: "sent" };
}
