"use server";

import { readEnv } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/brevo/client";
import { contactMessageEmail } from "@/lib/brevo/emails/contact-message";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot) {
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Prosim vnesite veljaven e-poštni naslov." };
  }
  if (message.length < 5) {
    return { status: "error", message: "Sporočilo je prekratko." };
  }
  if (message.length > 5000 || name.length > 200 || subject.length > 200) {
    return { status: "error", message: "Vsebina je predolga." };
  }

  try {
    const notify = readEnv("BREVO_NOTIFY_EMAIL");
    const { subject: emailSubject, text, html } = contactMessageEmail({
      name,
      email,
      subject,
      message,
    });

    await sendTransactionalEmail({
      to: { email: notify },
      subject: emailSubject,
      text,
      html,
      replyTo: { email, name: name || undefined },
    });

    return { status: "success" };
  } catch (err) {
    console.error("Contact form submission failed:", err);
    return {
      status: "error",
      message: "Sporočila ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
