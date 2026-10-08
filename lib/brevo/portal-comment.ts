import { trainerPortalConfig } from "@/lib/config";
import { supabase } from "@/lib/portal/backend";
type Mail = { id: string; subject: string; body: string };
export async function dispatchPortalComment(
  sessionId: string,
): Promise<string> {
  const key = process.env.PORTAL_SUPABASE_SERVICE_KEY;
  if (process.env.PORTAL_EMAIL_ENABLED !== "true" || !key) return "pending";
  if (
    !process.env.BREVO_API_KEY ||
    !process.env.BREVO_FROM_EMAIL ||
    !process.env.BREVO_FROM_NAME
  )
    return "pending";
  const items = await supabase<Mail[]>("/rest/v1/rpc/portal_claim_mail", key, {
    target_id: sessionId,
  });
  if (!items.length) return "none";
  const mail = items[0];
  let outcome = "uncertain";
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_FROM_EMAIL,
          name: process.env.BREVO_FROM_NAME,
        },
        to: [{ email: trainerPortalConfig.commentRecipient }],
        subject: mail.subject,
        textContent: mail.body,
        headers: { idempotencyKey: mail.id },
      }),
      signal: AbortSignal.timeout(10000),
    });
    outcome = response.ok
      ? "sent"
      : response.status < 500
        ? "failed"
        : "uncertain";
  } catch {
    outcome = "uncertain";
  }
  // Do not retry unknown deliveries automatically: operators reconcile with Brevo first.
  await supabase("/rest/v1/rpc/portal_mark_mail", key, {
    mail_id: mail.id,
    outcome,
  });
  return outcome;
}
