import { escapeHtml } from "@/lib/utils";

export type SpeakingInquiryEmailData = {
  name: string;
  email: string;
  company: string;
  eventDate?: string;
  format?: string;
  attendees?: string;
  message: string;
};

function valueOrFallback(value: string | undefined) {
  return value?.trim() || "(ni navedeno)";
}

export function speakingInquiryNotificationEmail(d: SpeakingInquiryEmailData) {
  const subject = `Povpraševanje za predavanje: ${d.company}`;

  const detailsText = `Ime: ${d.name}
E-pošta: ${d.email}
Podjetje / organizacija: ${d.company}
Datum dogodka: ${valueOrFallback(d.eventDate)}
Format: ${valueOrFallback(d.format)}
Število udeležencev: ${valueOrFallback(d.attendees)}`;

  const text = `Novo povpraševanje za predavanje ali delavnico Sama Jeranka.

${detailsText}

Sporočilo:
${d.message}

Odgovori neposredno na ta email. Pošiljatelj je v Reply-To.`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Novo povpraševanje za predavanje ali delavnico Sama Jeranka</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tbody>
        <tr>
          <td style="padding:8px 0;color:#8a8377;width:38%;">Ime</td>
          <td style="padding:8px 0;font-weight:600;">${escapeHtml(d.name)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8a8377;">E-pošta</td>
          <td style="padding:8px 0;"><a href="mailto:${escapeHtml(d.email)}" style="color:#d3a356;">${escapeHtml(d.email)}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8a8377;">Podjetje / organizacija</td>
          <td style="padding:8px 0;">${escapeHtml(d.company)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8a8377;">Datum dogodka</td>
          <td style="padding:8px 0;">${escapeHtml(valueOrFallback(d.eventDate))}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8a8377;">Format</td>
          <td style="padding:8px 0;">${escapeHtml(valueOrFallback(d.format))}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#8a8377;">Število udeležencev</td>
          <td style="padding:8px 0;">${escapeHtml(valueOrFallback(d.attendees))}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin:20px 0 0;padding:16px;background:#f7f5f2;border-left:3px solid #d3a356;white-space:pre-wrap;">${escapeHtml(d.message)}</div>

    <p style="margin:20px 0 0;color:#8a8377;font-size:13px;">
      Odgovori neposredno na ta email. Pošiljatelj je v Reply-To.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function speakingInquiryConfirmationEmail(d: SpeakingInquiryEmailData) {
  const subject = "Prejeli smo vaše povpraševanje za predavanje";

  const text = `Pozdravljeni,

hvala za povpraševanje za predavanje ali delavnico Sama Jeranka.

Prejeli smo vaše sporočilo in vam bomo odgovorili v kratkem. Če želite medtem dodati še kakšno informacijo o dogodku, nam lahko odgovorite na ta email.

Lep pozdrav,
ekipa Apnea.si`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;">Pozdravljeni,</p>
    <p style="margin:0 0 16px;">
      hvala za povpraševanje za predavanje ali delavnico Sama Jeranka.
    </p>
    <p style="margin:0 0 16px;">
      Prejeli smo vaše sporočilo in vam bomo odgovorili v kratkem. Če želite medtem dodati še kakšno informacijo o dogodku, nam lahko odgovorite na ta email.
    </p>
    <p style="margin:20px 0 0;">
      Lep pozdrav,<br>
      ekipa Apnea.si
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
