"use server";

import { sendTransactionalEmail } from "@/lib/brevo/client";
import {
  giftVoucherRequestConfirmationEmail,
  giftVoucherRequestNotificationEmail,
} from "@/lib/brevo/emails/gift-voucher-request";
import {
  giftVoucherFormSchema,
  type GiftVoucherFormInput,
} from "@/lib/gift-voucher-schema";
import { siteConfig } from "@/lib/config";
import { readEnv } from "@/lib/env";

export type GiftVoucherRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitGiftVoucherRequest(
  raw: GiftVoucherFormInput
): Promise<GiftVoucherRequestResult> {
  const parsed = giftVoucherFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  }
  const data = parsed.data;
  const voucher = siteConfig.giftVoucher;
  const emailData = {
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    recipientName: data.recipientName,
    message: data.message,
    voucherName: voucher.fullName,
    priceInEuros: voucher.price,
  };

  try {
    const notify = readEnv("BREVO_NOTIFY_EMAIL");
    const notification = giftVoucherRequestNotificationEmail(emailData);
    const confirmation = giftVoucherRequestConfirmationEmail(emailData);

    await Promise.all([
      sendTransactionalEmail({
        to: { email: notify },
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        replyTo: { email: data.buyerEmail, name: data.buyerName },
      }),
      sendTransactionalEmail({
        to: { email: data.buyerEmail, name: data.buyerName },
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
        replyTo: { email: notify, name: "Apnea Slovenija" },
      }),
    ]);

    return { ok: true };
  } catch (error) {
    console.error("Gift voucher request failed:", error);
    return {
      ok: false,
      error: "Povpraševanja ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
