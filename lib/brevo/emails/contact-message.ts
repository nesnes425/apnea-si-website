import { escapeHtml } from "@/lib/utils";

export type ContactMessageData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function contactMessageEmail(d: ContactMessageData) {
  const senderLabel = d.name ? `${d.name} (${d.email})` : d.email;
  const subjectLine = d.subject
    ? `Sporočilo s spletne strani: ${d.subject}`
    : `Sporočilo s spletne strani — ${senderLabel}`;

  const text = `Novo sporočilo s kontaktnega obrazca apnea.si.

Od: ${d.name || "(brez imena)"} <${d.email}>
Zadeva: ${d.subject || "(brez zadeve)"}

Sporočilo:
${d.message}

—
Odgovori neposredno na ta email — pošiljatelj je v Reply-To.`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Novo sporočilo s kontaktnega obrazca apnea.si</p>

    <p style="margin:0;">
      <strong>Od:</strong> ${escapeHtml(d.name || "(brez imena)")}
      &lt;<a href="mailto:${escapeHtml(d.email)}" style="color:#d3a356;">${escapeHtml(d.email)}</a>&gt;<br>
      <strong>Zadeva:</strong> ${escapeHtml(d.subject || "(brez zadeve)")}
    </p>

    <div style="margin:20px 0 0;padding:16px;background:#f7f5f2;border-left:3px solid #d3a356;white-space:pre-wrap;">${escapeHtml(d.message)}</div>

    <p style="margin:20px 0 0;color:#8a8377;font-size:13px;">
      Odgovori neposredno na ta email — pošiljatelj je v Reply-To.
    </p>
  </div>
</body>
</html>`;

  return { subject: subjectLine, text, html };
}
