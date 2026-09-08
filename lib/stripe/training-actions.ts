"use server";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { trainingStripe } from "./training-client";
import { COOKIE_NAME, parseConsent } from "@/lib/cookie-consent";
import {
  attachPaymentIntentToTrainingHold,
  createTrainingHold,
  releaseTrainingHold,
  validateTrainingHold,
} from "@/lib/sanity/training-holds";
import { getTrainingGroup, getTrainingSettings } from "@/lib/sanity/queries";
import {
  trainingReservationSchema,
  type TrainingReservationInput,
} from "@/lib/training-reservation-schema";

export type CreateTrainingPaymentResult =
  | { ok: true; clientSecret: string; paymentIntentId: string; token: string; expiresAt: string }
  | { ok: false; error: string };

export async function createTrainingPaymentIntent(
  raw: TrainingReservationInput
): Promise<CreateTrainingPaymentResult> {
  const parsed = trainingReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  }

  const hold = await createTrainingHold(parsed.data);
  if (!hold.ok) return hold;

  try {
    const [group, settings] = await Promise.all([
      getTrainingGroup(parsed.data.groupId),
      getTrainingSettings(),
    ]);
    if (!group || !settings) {
      await releaseTrainingHold({ groupId: parsed.data.groupId, token: hold.token });
      return { ok: false, error: "Izbrana skupina ni več na voljo." };
    }

    const amount = Math.round(settings.membershipFee * 100);
    const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
    const marketingConsent =
      parseConsent(cookieStore.get(COOKIE_NAME)?.value)?.marketing === true;
    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;
    const clientUserAgent = requestHeaders.get("user-agent")?.slice(0, 450);
    const metaAttribution = marketingConsent
      ? {
          metaMarketingConsent: "true",
          ...(fbp ? { metaFbp: fbp } : {}),
          ...(fbc ? { metaFbc: fbc } : {}),
          ...(clientUserAgent ? { metaClientUserAgent: clientUserAgent } : {}),
        }
      : { metaMarketingConsent: "false" };
    const intent = await trainingStripe.paymentIntents.create({
      amount,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      description: `Letna članarina ŠD Apnea Slovenija — ${group.program.name}, ${group.venue.name}`,
      metadata: {
        type: "training_membership",
        trainingGroupId: group._id,
        trainingHoldTokenHash: createHash("sha256").update(hold.token).digest("hex"),
        trainingProgram: group.program.name,
        trainingVenue: group.venue.name,
        trainingCity: group.venue.city,
        trainingWeekday: group.weekday,
        trainingTime: `${group.startTime}–${group.endTime}`,
        customerName: parsed.data.fullName,
        customerEmail: parsed.data.email,
        customerPhone: parsed.data.phone,
        customerAddress: parsed.data.address,
        customerPostalCode: parsed.data.postalCode,
        customerCity: parsed.data.city,
        ...metaAttribution,
      },
    });

    if (!intent.client_secret) {
      await releaseTrainingHold({ groupId: group._id, token: hold.token });
      return { ok: false, error: "Napaka pri pripravi plačila. Poskusite znova." };
    }
    await attachPaymentIntentToTrainingHold({
      groupId: group._id,
      token: hold.token,
      paymentIntentId: intent.id,
    });

    return {
      ok: true,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      token: hold.token,
      expiresAt: hold.expiresAt,
    };
  } catch (error) {
    await releaseTrainingHold({ groupId: parsed.data.groupId, token: hold.token });
    console.error("Unable to create training PaymentIntent", error);
    return { ok: false, error: "Napaka pri pripravi plačila. Poskusite znova." };
  }
}

export async function validateTrainingPaymentHold(params: {
  groupId: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return validateTrainingHold(params);
}
