"use server";

import { stripe } from "./client";
import { siteConfig } from "@/lib/config";
import {
  giftVoucherFormSchema,
  type GiftVoucherFormInput,
} from "@/lib/gift-voucher-schema";

export type CreateGiftVoucherResult =
  | { ok: true; clientSecret: string; paymentIntentId: string }
  | { ok: false; error: string };

export async function createGiftVoucherPaymentIntent(
  raw: GiftVoucherFormInput
): Promise<CreateGiftVoucherResult> {
  const parsed = giftVoucherFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  }
  const data = parsed.data;
  const voucher = siteConfig.giftVoucher;

  const description = `${voucher.fullName} — za ${data.recipientName}`;

  const intent = await stripe.paymentIntents.create({
    amount: voucher.priceInCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    receipt_email: data.buyerEmail,
    description,
    metadata: {
      type: "gift_voucher",
      buyerName: data.buyerName,
      buyerEmail: data.buyerEmail,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      // Stripe metadata caps each value at 500 chars; schema already enforces 500.
      message: data.message ?? "",
    },
  });

  if (!intent.client_secret) {
    return { ok: false, error: "Napaka pri ustvarjanju plačila. Poskusite znova." };
  }

  return {
    ok: true,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}
