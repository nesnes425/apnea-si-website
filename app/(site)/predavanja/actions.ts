"use server";

import { readEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/brevo/client";
import {
  speakingInquiryConfirmationEmail,
  speakingInquiryNotificationEmail,
} from "@/lib/brevo/emails/speaking-inquiry";

export type SpeakingInquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function submitSpeakingInquiry(
  _prev: SpeakingInquiryState,
  formData: FormData,
): Promise<SpeakingInquiryState> {
  const honeypot = clean(formData.get("website"));
  if (honeypot) return { status: "success" };

  const name = clean(formData.get("name"));
  const email = clean(formData.get("email"));
  const company = clean(formData.get("company"));
  const eventDate = clean(formData.get("eventDate"));
  const format = clean(formData.get("format"));
  const attendees = clean(formData.get("attendees"));
  const message = clean(formData.get("message"));

  if (!name) return { status: "error", message: "Prosim vnesite ime in priimek." };
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Prosim vnesite veljaven e-poštni naslov." };
  }
  if (!company) return { status: "error", message: "Prosim vnesite podjetje ali organizacijo." };
  if (!message || message.length < 5) {
    return { status: "error", message: "Prosim napišite nekaj več o dogodku." };
  }
  if ([name, email, company, eventDate, format, attendees].some((v) => v.length > 200) || message.length > 5000) {
    return { status: "error", message: "Vsebina je predolga." };
  }

  const inquiry = {
    name,
    email,
    company,
    eventDate,
    format,
    attendees,
    message,
  };

  try {
    const notify = readEnv("BREVO_NOTIFY_EMAIL");
    const notification = speakingInquiryNotificationEmail(inquiry);
    const confirmation = speakingInquiryConfirmationEmail(inquiry);

    await Promise.all([
      sendTransactionalEmail({
        to: { email: notify },
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        replyTo: { email, name },
      }),
      sendTransactionalEmail({
        to: { email, name },
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
        replyTo: { email: notify },
      }),
    ]);

    return { status: "success" };
  } catch (err) {
    console.error("Speaking inquiry failed:", err);
    return {
      status: "error",
      message: "Povpraševanja ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
