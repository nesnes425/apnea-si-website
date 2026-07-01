"use server";

import { upsertEmailContact } from "@/lib/brevo/client";
import { readOptionalEnvNumber } from "@/lib/env";

export type NewsletterSignupState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APNEA_NEWSLETTER_LIST_ID = 9;
const EQUALIZATION_GUIDE_LIST_ID = 20;

function newsletterListIds() {
  return [
    readOptionalEnvNumber("BREVO_LIST_APNEA_NEWSLETTER") ??
      APNEA_NEWSLETTER_LIST_ID,
    readOptionalEnvNumber("BREVO_LIST_IZENACEVANJE_PRIJAVE") ??
      EQUALIZATION_GUIDE_LIST_ID,
  ];
}

export async function submitNewsletterSignup(
  _prev: NewsletterSignupState,
  formData: FormData,
): Promise<NewsletterSignupState> {
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot) {
    return { status: "success" };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Prosim vnesite veljaven e-poštni naslov." };
  }
  if (email.length > 200) {
    return { status: "error", message: "E-poštni naslov je predolg." };
  }

  try {
    await upsertEmailContact({
      email,
      listIds: newsletterListIds(),
    });

    return { status: "success" };
  } catch (err) {
    console.error("Newsletter signup failed:", err);
    return {
      status: "error",
      message:
        "Prijave trenutno ni mogoče shraniti. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
