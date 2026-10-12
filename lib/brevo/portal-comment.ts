import { trainerPortalConfig } from "@/lib/config";
import { supabase } from "@/lib/portal/http";
type Mail = { id: string; subject: string; body: string };
export function portalCommentMailReady() {
  return process.env.PORTAL_EMAIL_ENABLED === "true" && Boolean(
    process.env.PORTAL_SUPABASE_SERVICE_KEY && process.env.PORTAL_SUPABASE_URL &&
    process.env.PORTAL_SUPABASE_ANON_KEY && process.env.BREVO_API_KEY &&
    process.env.BREVO_FROM_EMAIL && process.env.BREVO_FROM_NAME,
  );
}
export async function dispatchPortalComment(
  sessionId: string,
): Promise<string> {
  const key = process.env.PORTAL_SUPABASE_SERVICE_KEY;
  if (!portalCommentMailReady()) return "pending";
  const items = await supabase<Mail[]>("/rest/v1/rpc/portal_claim_mail", key, {
    target_id: sessionId,
  });
  if (!items.length) return "none";
  const mail = items[0];
  const outcome = await sendPortalCommentEmail(mail);
  // Do not retry unknown deliveries automatically: operators reconcile with Brevo first.
  await supabase("/rest/v1/rpc/portal_mark_mail", key, {
    mail_id: mail.id,
    outcome,
  });
  return outcome;
}

// Also used for an explicit synthetic delivery test, without creating attendance.
export async function sendPortalCommentEmail(mail: Mail) {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_FROM_EMAIL || !process.env.BREVO_FROM_NAME)
    throw new Error("Pošiljanje komentarjev ni nastavljeno.");
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
  return outcome;
}

export async function dispatchPendingPortalComments() {
  if (!portalCommentMailReady()) throw new Error("Pošiljanje komentarjev ni nastavljeno.");
  const pending = await supabase<{ session_id: string }[]>(
    "/rest/v1/portal_outbox?status=eq.pending&select=session_id&order=created_at.asc&limit=20",
    process.env.PORTAL_SUPABASE_SERVICE_KEY,
  );
  const counts: Record<string, number> = {};
  const started = Date.now();
  for (const sessionId of new Set(pending.map(item => item.session_id))) {
    // Leave time for one claim + provider request + acknowledgement on Vercel.
    if (Date.now() - started > 15000) break;
    try {
      const outcome = await dispatchPortalComment(sessionId);
      counts[outcome] = (counts[outcome] || 0) + 1;
    } catch {
      // A failed acknowledgement might follow a successful delivery. Never reset
      // sending/uncertain rows to pending without checking provider logs first.
      counts.errors = (counts.errors || 0) + 1;
    }
  }
  return counts;
}
