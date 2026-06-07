import { escapeHtml } from "@/lib/utils";
import type { TrainingConfirmationData } from "./training-confirmation";

type TrainingNotificationData = TrainingConfirmationData & {
  customerEmail: string;
  customerPhone: string;
};

export function trainingNotificationEmail(d: TrainingNotificationData) {
  const subject = `Nova prijava na trening: ${d.customerName} — ${d.venue}, ${d.weekday} ${d.time}`;
  const stripeUrl = `https://dashboard.stripe.com/payments/${d.paymentIntentId}`;
  const text = `Nova potrjena prijava na trening.

Skupina: ${d.program}
Lokacija: ${d.venue}, ${d.city}
Termin: ${d.weekday}, ${d.time}

Udeleženec:
${d.customerName}
${d.customerEmail}
${d.customerPhone}

Plačano: ${d.membershipFee} € letne članarine
Stripe: ${stripeUrl}`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Nova potrjena prijava na trening.</p>
    <p><strong>Skupina:</strong> ${escapeHtml(d.program)}<br>
    <strong>Lokacija:</strong> ${escapeHtml(d.venue)}, ${escapeHtml(d.city)}<br>
    <strong>Termin:</strong> ${escapeHtml(d.weekday)}, ${escapeHtml(d.time)}</p>
    <p><strong>Udeleženec:</strong><br>${escapeHtml(d.customerName)}<br>
    <a href="mailto:${escapeHtml(d.customerEmail)}" style="color:#d3a356;">${escapeHtml(d.customerEmail)}</a><br>
    ${escapeHtml(d.customerPhone)}</p>
    <p><strong>Plačano:</strong> ${d.membershipFee} € letne članarine</p>
    <p><a href="${stripeUrl}" style="color:#d3a356;font-weight:500;">Odpri v Stripe Dashboard →</a></p>
  </div>
</body>
</html>`;
  return { subject, text, html };
}

export function trainingCapacityConflictEmail(d: TrainingNotificationData) {
  const subject = `NUJNO: plačan trening brez prostega mesta — ${d.customerName}`;
  const stripeUrl = `https://dashboard.stripe.com/payments/${d.paymentIntentId}`;
  const text = `Plačilo članarine je uspelo, vendar mesta v skupini ni bilo mogoče potrditi.

Skupina: ${d.program}, ${d.venue}, ${d.weekday} ${d.time}
Udeleženec: ${d.customerName}, ${d.customerEmail}, ${d.customerPhone}
Plačilo: ${d.membershipFee} €

Nemudoma preverite skupino in uredite vključitev ali vračilo:
${stripeUrl}`;
  const html = `<p><strong>Plačilo članarine je uspelo, vendar mesta v skupini ni bilo mogoče potrditi.</strong></p>
<p>${escapeHtml(d.program)} · ${escapeHtml(d.venue)} · ${escapeHtml(d.weekday)} ${escapeHtml(d.time)}</p>
<p>${escapeHtml(d.customerName)} · ${escapeHtml(d.customerEmail)} · ${escapeHtml(d.customerPhone)}</p>
<p><a href="${stripeUrl}">Nemudoma preverite plačilo in uredite vključitev ali vračilo.</a></p>`;
  return { subject, text, html };
}
