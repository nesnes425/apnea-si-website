import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type GiftVoucherRequestEmailData = {
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  message?: string;
  voucherName: string;
  priceInEuros: number;
};

export function giftVoucherRequestConfirmationEmail(d: GiftVoucherRequestEmailData) {
  const { first } = splitName(d.buyerName);
  const subject = `Povpraševanje prejeto: ${d.voucherName}`;

  const text = `Pozdravljeni, ${first || d.buyerName},

prejeli smo vaše povpraševanje za darilni bon.

BON
${d.voucherName}
Za: ${d.recipientName}
Cena: €${d.priceInEuros}

KAJ SLEDI
Samo bo preveril podatke in vam poslal nadaljnje informacije za plačilo oziroma račun. Bon še ni izdan.

VPRAŠANJA
Pišite nam na ${siteConfig.email} ali pokličite ${siteConfig.phone}.

Lep pozdrav,
Samo Jeranko
Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(first || d.buyerName)}</strong>,</p>
    <p>prejeli smo vaše povpraševanje za darilni bon. Bon še ni izdan.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Bon</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.voucherName)}</p>
    <p style="margin:0 0 4px;">Za: ${escapeHtml(d.recipientName)}</p>
    <p style="margin:0;">Cena: <strong>€${d.priceInEuros}</strong></p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Kaj sledi</p>
    <p>Samo bo preveril podatke in vam poslal nadaljnje informacije za plačilo oziroma račun.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;">Vprašanja?</p>
    <p style="margin:0;">
      <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a>
      &nbsp;·&nbsp;
      <a href="tel:${siteConfig.phone.replace(/\s/g, "")}" style="color:#d3a356;text-decoration:none;">${siteConfig.phone}</a>
    </p>

    <p style="margin:32px 0 0;">Lep pozdrav,<br>
    <strong>Samo Jeranko</strong><br>
    <span style="color:#8a8377;">Apnea Slovenija</span></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export function giftVoucherRequestNotificationEmail(d: GiftVoucherRequestEmailData) {
  const subject = `Novo povpraševanje za darilni bon: ${d.buyerName} za ${d.recipientName}`;
  const message = d.message?.trim();

  const text = `Novo povpraševanje za darilni bon.

Bon: ${d.voucherName}
Cena: €${d.priceInEuros}

Kupec:
${d.buyerName}
${d.buyerEmail}

Obdarjenec:
${d.recipientName}

Osebno sporočilo:
${message || "Brez sporočila."}

Pomembno:
- Bon še ni izdan.
- Plačilo/račun še ni urejen.
- PDF bona se ne generira samodejno.
- Samo mora kupcu poslati nadaljnje informacije in po plačilu ročno urediti bon.`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Novo povpraševanje za darilni bon.</p>

    <p style="margin:0;"><strong>Bon:</strong> ${escapeHtml(d.voucherName)}<br>
    <strong>Cena:</strong> €${d.priceInEuros}</p>

    <p style="margin:16px 0 0;"><strong>Kupec:</strong><br>
    ${escapeHtml(d.buyerName)}<br>
    <a href="mailto:${escapeHtml(d.buyerEmail)}" style="color:#d3a356;">${escapeHtml(d.buyerEmail)}</a></p>

    <p style="margin:16px 0 0;"><strong>Obdarjenec:</strong><br>
    ${escapeHtml(d.recipientName)}</p>

    <p style="margin:16px 0 0;"><strong>Osebno sporočilo:</strong><br>
    ${message ? escapeHtml(message).replace(/\n/g, "<br>") : "Brez sporočila."}</p>

    <div style="margin:20px 0 0;padding:14px 16px;background:#fff7e8;border:1px solid #efd7aa;">
      <p style="margin:0 0 8px;font-weight:600;">Pomembno</p>
      <ul style="margin:0;padding-left:20px;">
        <li>Bon še ni izdan.</li>
        <li>Plačilo/račun še ni urejen.</li>
        <li>PDF bona se ne generira samodejno.</li>
        <li>Samo mora kupcu poslati nadaljnje informacije in po plačilu ročno urediti bon.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
