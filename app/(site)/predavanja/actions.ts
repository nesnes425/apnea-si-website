"use server";

import { readEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/brevo/client";
import { contactMessageEmail } from "@/lib/brevo/emails/contact-message";

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

  const internalMessage = [
    "Novo povpraševanje za predavanje Sama Jeranka.",
    "",
    `Ime: ${name}`,
    `E-pošta: ${email}`,
    `Podjetje / organizacija: ${company}`,
    `Datum dogodka: ${eventDate || "(ni navedeno)"}`,
    `Format: ${format || "(ni navedeno)"}`,
    `Število udeležencev: ${attendees || "(ni navedeno)"}`,
    "",
    "Sporočilo:",
    message,
  ].join("\n");

  try {
    const notify = readEnv("BREVO_NOTIFY_EMAIL");
    const { subject, text, html } = contactMessageEmail({
      name,
      email,
      subject: `Predavanje / delavnica: ${company}`,
      message: internalMessage,
    });

    await sendTransactionalEmail({
      to: { email: notify },
      subject,
      text,
      html,
      replyTo: { email, name },
    });

    return { status: "success" };
  } catch (err) {
    console.error("Speaking inquiry failed:", err);
    return {
      status: "error",
      message: "Povpraševanja ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
