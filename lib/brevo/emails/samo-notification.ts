export type SamoNotificationData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  courseName: string;
  dateRange: string;
  location: string;
  priceInEuros: number;
  paymentIntentId: string;
};

export function samoNotificationEmail(d: SamoNotificationData) {
  const subject = `Nova prijava: ${d.customerName} — ${d.courseName}, ${d.dateRange}`;
  const stripeUrl = `https://dashboard.stripe.com/payments/${d.paymentIntentId}`;

  const text = `Nova prijava na tečaj.

Tečaj: ${d.courseName}
Termin: ${d.dateRange}
Lokacija: ${d.location}

Stranka:
${d.customerName}
${d.customerEmail}
${d.customerPhone}

Plačilo: €${d.priceInEuros} — potrjeno
Stripe ID: ${d.paymentIntentId}

Stripe Dashboard: ${stripeUrl}`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Nova prijava na tečaj.</p>

    <p style="margin:0;"><strong>Tečaj:</strong> ${escapeHtml(d.courseName)}<br>
    <strong>Termin:</strong> ${escapeHtml(d.dateRange)}<br>
    <strong>Lokacija:</strong> ${escapeHtml(d.location)}</p>

    <p style="margin:16px 0 0;"><strong>Stranka:</strong><br>
    ${escapeHtml(d.customerName)}<br>
    <a href="mailto:${escapeHtml(d.customerEmail)}" style="color:#d3a356;">${escapeHtml(d.customerEmail)}</a><br>
    <a href="tel:${escapeHtml(d.customerPhone.replace(/\s/g, ""))}" style="color:#d3a356;">${escapeHtml(d.customerPhone)}</a></p>

    <p style="margin:16px 0 0;"><strong>Plačilo:</strong> €${d.priceInEuros} — potrjeno<br>
    <span style="color:#8a8377;font-size:13px;">Stripe ID: ${escapeHtml(d.paymentIntentId)}</span></p>

    <p style="margin:20px 0 0;">
      <a href="${stripeUrl}" style="color:#d3a356;text-decoration:none;font-weight:500;">Odpri v Stripe Dashboard →</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
