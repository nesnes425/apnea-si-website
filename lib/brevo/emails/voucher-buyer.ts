import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type VoucherBuyerEmailData = {
  buyerName: string;
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  voucherCode: string;
  priceInEuros: number;
  paymentIntentId: string;
  validUntilLabel: string; // pre-formatted Slovenian date
};

export function voucherBuyerEmail(d: VoucherBuyerEmailData) {
  const { first: firstName } = splitName(d.buyerName);
  const subject = `Vaš darilni bon je pripravljen — ${d.courseName}`;

  const text = `Pozdravljeni, ${firstName || d.buyerName},

vaš darilni bon je pripravljen in priložen tej e-pošti kot PDF.

DARILNI BON
${d.courseName}
Za: ${d.recipientName}
Koda bona: ${d.voucherCode}
Velja do: ${d.validUntilLabel}

Plačano: €${d.priceInEuros}
Številka transakcije: ${d.paymentIntentId}

KAJ SLEDI

Bon smo poslali tudi neposredno na e-naslov obdarjenca (${d.recipientEmail}). Če ga raje natisnete in osebno izročite, je PDF priložen tudi tej e-pošti.

Ko se obdarjenec odloči, kdaj želi tečaj, naj nam piše na ${siteConfig.email} in navede kodo bona — termin uredimo skupaj.

VPRAŠANJA

Pišite nam na ${siteConfig.email} ali pokličite ${siteConfig.phone}.

Hvala in se vidimo pod vodo,
Samo Jeranko
Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(firstName || d.buyerName)}</strong>,</p>
    <p>vaš darilni bon je pripravljen in priložen tej e-pošti kot PDF.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Darilni bon</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.courseName)}</p>
    <p style="margin:0 0 4px;">Za: <strong>${escapeHtml(d.recipientName)}</strong></p>
    <p style="margin:0 0 4px;font-family:'Courier New',monospace;">Koda bona: <strong>${escapeHtml(d.voucherCode)}</strong></p>
    <p style="margin:0 0 16px;color:#8a8377;font-size:14px;">Velja do ${escapeHtml(d.validUntilLabel)}.</p>
    <p style="margin:0;">Plačano: <strong>€${d.priceInEuros}</strong><br>
    <span style="color:#8a8377;font-size:13px;">Številka transakcije: ${escapeHtml(d.paymentIntentId)}</span></p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Kaj sledi</p>
    <p>Bon smo poslali tudi neposredno na e-naslov obdarjenca (<strong>${escapeHtml(d.recipientEmail)}</strong>). Če ga raje natisnete in osebno izročite, je PDF priložen tudi tej e-pošti.</p>
    <p>Ko se obdarjenec odloči, kdaj želi tečaj, naj nam piše na <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a> in navede kodo bona — termin uredimo skupaj.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;">Vprašanja?</p>
    <p style="margin:0;">
      <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a>
      &nbsp;·&nbsp;
      <a href="tel:${siteConfig.phone.replace(/\s/g, "")}" style="color:#d3a356;text-decoration:none;">${siteConfig.phone}</a>
    </p>

    <p style="margin:32px 0 0;">Hvala in se vidimo pod vodo,<br>
    <strong>Samo Jeranko</strong><br>
    <span style="color:#8a8377;">Apnea Slovenija</span></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
