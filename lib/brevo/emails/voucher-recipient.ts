import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type VoucherRecipientEmailData = {
  buyerName: string;
  recipientName: string;
  message?: string;
  courseName: string;
  voucherCode: string;
  validUntilLabel: string;
};

export function voucherRecipientEmail(d: VoucherRecipientEmailData) {
  const { first: recipientFirstName } = splitName(d.recipientName);
  const subject = `${d.buyerName} vam podarja tečaj prostega potapljanja`;

  const messageText = d.message
    ? `\n\nSporočilo od ${d.buyerName}:\n"${d.message}"\n`
    : "";

  const text = `Pozdravljeni, ${recipientFirstName || d.recipientName},

${d.buyerName} vam podarja darilni bon za ${d.courseName} pri Apnea Slovenija.${messageText}

VAŠ DARILNI BON
${d.courseName}
Koda bona: ${d.voucherCode}
Velja do: ${d.validUntilLabel}

Bon je priložen tej e-pošti kot PDF.

KAKO UNOVČITI BON

Ko se odločite, kdaj želite tečaj, nam pišite na ${siteConfig.email} in navedite kodo bona. Skupaj izberemo termin in lokacijo, ki vam ustrezata.

Termini se izvajajo od marca do avgusta na 5 lokacijah po Sloveniji (Ljubljana, Nova Gorica, Velenje, Novo Mesto, Koper).

VPRAŠANJA

${siteConfig.email} · ${siteConfig.phone}

Veselimo se srečanja pod vodo,
Samo Jeranko
Apnea Slovenija`;

  const messageHtml = d.message
    ? `<p style="margin:24px 0;border-left:2px solid #d3a356;padding-left:16px;font-style:italic;color:#33404f;">&ldquo;${escapeHtml(d.message)}&rdquo;<br><span style="color:#8a8377;font-size:13px;font-style:normal;">— ${escapeHtml(d.buyerName)}</span></p>`
    : "";

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(recipientFirstName || d.recipientName)}</strong>,</p>
    <p><strong>${escapeHtml(d.buyerName)}</strong> vam podarja darilni bon za <strong>${escapeHtml(d.courseName)}</strong> pri Apnea Slovenija.</p>

    ${messageHtml}

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Vaš darilni bon</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.courseName)}</p>
    <p style="margin:0 0 4px;font-family:'Courier New',monospace;">Koda bona: <strong>${escapeHtml(d.voucherCode)}</strong></p>
    <p style="margin:0 0 16px;color:#8a8377;font-size:14px;">Velja do ${escapeHtml(d.validUntilLabel)}.</p>
    <p style="margin:0;color:#8a8377;font-size:13px;">Bon je priložen tej e-pošti kot PDF.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Kako unovčiti bon</p>
    <p>Ko se odločite, kdaj želite tečaj, nam pišite na <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a> in navedite kodo bona. Skupaj izberemo termin in lokacijo, ki vam ustrezata.</p>
    <p>Termini se izvajajo od marca do avgusta na 5 lokacijah po Sloveniji.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;">Vprašanja?</p>
    <p style="margin:0;">
      <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a>
      &nbsp;·&nbsp;
      <a href="tel:${siteConfig.phone.replace(/\s/g, "")}" style="color:#d3a356;text-decoration:none;">${siteConfig.phone}</a>
    </p>

    <p style="margin:32px 0 0;">Veselimo se srečanja pod vodo,<br>
    <strong>Samo Jeranko</strong><br>
    <span style="color:#8a8377;">Apnea Slovenija</span></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
