import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type TrainingConfirmationData = {
  customerName: string;
  program: string;
  venue: string;
  city: string;
  weekday: string;
  time: string;
  membershipFee: number;
  paymentIntentId: string;
};

export function trainingConfirmationEmail(d: TrainingConfirmationData) {
  const { first } = splitName(d.customerName);
  const subject = `Potrjena prijava na trening — ${d.program}, ${d.venue}`;
  const text = `Pozdravljeni, ${first || d.customerName},

vaše mesto v izbrani trening skupini je potrjeno.

VAŠA SKUPINA
${d.program}
${d.venue}, ${d.city}
${d.weekday}, ${d.time}

Plačano: ${d.membershipFee} € letne članarine ŠD Apnea Slovenija
S plačilom članarine ste rezervirali mesto v skupini.
Številka transakcije: ${d.paymentIntentId}
Račun za plačano članarino je priložen temu e-sporočilu.

Podrobnosti o plačilu vadnine in začetku treningov boste prejeli po e-pošti.

Vprašanja? Pišite na ${siteConfig.email} ali pokličite ${siteConfig.phone}.

Se vidimo na treningu,
Ekipa Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(first || d.customerName)}</strong>,</p>
    <p>vaše mesto v izbrani trening skupini je potrjeno.</p>
    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">
    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Vaša skupina</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.program)}</p>
    <p style="margin:0 0 4px;">${escapeHtml(d.venue)}, ${escapeHtml(d.city)}</p>
    <p style="margin:0 0 16px;">${escapeHtml(d.weekday)}, ${escapeHtml(d.time)}</p>
    <p style="margin:0;"><strong>Plačano: ${d.membershipFee} € letne članarine</strong><br>
    <span style="color:#8a8377;font-size:14px;">S plačilom članarine ste rezervirali mesto v skupini.</span><br>
    <span style="color:#8a8377;font-size:13px;">Številka transakcije: ${escapeHtml(d.paymentIntentId)}</span><br>
    <span style="color:#8a8377;font-size:14px;">Račun za plačano članarino je priložen temu e-sporočilu.</span></p>
    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">
    <p>Podrobnosti o plačilu vadnine in začetku treningov boste prejeli po e-pošti.</p>
    <p style="margin:0;">Vprašanja? <a href="mailto:${siteConfig.email}" style="color:#d3a356;">${siteConfig.email}</a> · ${siteConfig.phone}</p>
    <p style="margin:32px 0 0;">Se vidimo na treningu,<br><strong>Ekipa Apnea Slovenija</strong></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
