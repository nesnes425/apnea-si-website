"use server";

import { sendTransactionalEmail, upsertEmailContact } from "@/lib/brevo/client";
import { statikaGuideEmail } from "@/lib/brevo/emails/statika-guide";
import { readOptionalEnvNumber } from "@/lib/env";

export type GuideSignupState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APNEA_NEWSLETTER_LIST_ID = 9;
const PRIROCNIK_STATIKA_LIST_ID = 53;

function statikaListIds() {
  return [
    readOptionalEnvNumber("BREVO_LIST_APNEA_NEWSLETTER") ??
      APNEA_NEWSLETTER_LIST_ID,
    readOptionalEnvNumber("BREVO_LIST_PRIROCNIK_STATIKA") ??
      PRIROCNIK_STATIKA_LIST_ID,
  ];
}

export async function submitStatikaGuideSignup(
  _prev: GuideSignupState,
  formData: FormData,
): Promise<GuideSignupState> {
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot) {
    console.warn("Statika guide signup ignored: honeypot field was filled");
    return { status: "success" };
  }

  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name) {
    return { status: "error", message: "Prosim vnesite svoje ime." };
  }
  if (name.length > 100) {
    return { status: "error", message: "Ime je predolgo." };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Prosim vnesite veljaven e-poštni naslov." };
  }
  if (email.length > 200) {
    return { status: "error", message: "E-poštni naslov je predolg." };
  }

  const firstName = name.split(" ")[0];

  // List membership is secondary: if Brevo rejects the contact, the reader
  // should still get the guide they asked for.
  try {
    await upsertEmailContact({ email, firstName, listIds: statikaListIds() });
  } catch (err) {
    console.error("Statika guide contact sync failed:", err);
  }

  try {
    const { subject, text, html } = statikaGuideEmail({ firstName });
    await sendTransactionalEmail({ to: { email, name }, subject, text, html });
    return { status: "success" };
  } catch (err) {
    console.error("Statika guide email failed:", err);
    return {
      status: "error",
      message:
        "Priročnika trenutno ni mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
