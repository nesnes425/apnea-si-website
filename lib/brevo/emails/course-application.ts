import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type CourseApplicationEmailData = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
  courseName: string;
  dateRange: string;
  location: string;
  priceInEuros: number;
};

export function courseApplicationConfirmationEmail(d: CourseApplicationEmailData) {
  const { first } = splitName(d.customerName);
  const subject = `Prijava prejeta: ${d.courseName}, ${d.dateRange}`;

  const text = `Pozdravljeni, ${first || d.customerName},

prejeli smo vašo prijavo na ${d.courseName}. V kratkem se vam javimo z nadaljnjimi informacijami za potrditev udeležbe ter plačilo akontacije.

VAŠ IZBRANI TERMIN
${d.courseName}
${d.dateRange}, ${d.location}
Bazenski del

Cena: €${d.priceInEuros}

GLOBINSKI DEL
Globinski del (morje) se izvaja maj–avgust. Podrobnosti uskladimo po bazenskem delu tečaja.

VPRAŠANJA
Pišite nam na ${siteConfig.email} ali pokličite ${siteConfig.phone}.

Lep pozdrav,
Samo Jeranko
Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(first || d.customerName)}</strong>,</p>
    <p>prejeli smo vašo prijavo na <strong>${escapeHtml(d.courseName)}</strong>. V kratkem se vam javimo z nadaljnjimi informacijami za potrditev udeležbe ter plačilo akontacije.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Vaš izbrani termin</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.courseName)}</p>
    <p style="margin:0 0 4px;">${escapeHtml(d.dateRange)}, ${escapeHtml(d.location)}</p>
    <p style="margin:0 0 16px;color:#8a8377;font-size:14px;">Bazenski del</p>
    <p style="margin:0;">Cena: <strong>€${d.priceInEuros}</strong></p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Globinski del</p>
    <p>Globinski del (morje) se izvaja maj–avgust. Podrobnosti uskladimo po bazenskem delu tečaja.</p>

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

export function courseApplicationNotificationEmail(d: CourseApplicationEmailData) {
  const subject = `Nova prijava na tečaj: ${d.customerName} — ${d.courseName}, ${d.dateRange}`;
  const phoneHref = d.customerPhone.replace(/\s/g, "");
  const note = d.note?.trim();

  const text = `Nova prijava na tečaj.

Tečaj: ${d.courseName}
Termin: ${d.dateRange}
Lokacija: ${d.location}
Cena: €${d.priceInEuros}

Stranka:
${d.customerName}
${d.customerEmail}
${d.customerPhone}

Opomba:
${note || "Brez opombe."}

Pomembno:
- Prijava še ni potrjena.
- Plačilo/račun še ni urejen.
- Oseba ni samodejno dodana na Brevo seznam udeležencev ali alumni seznam.
- Po potrditvi in plačilu jo ročno dodajte na ustrezen seznam oziroma uredite po svojem postopku.`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:24px;">
    <p style="margin:0 0 16px;font-weight:600;">Nova prijava na tečaj.</p>

    <p style="margin:0;"><strong>Tečaj:</strong> ${escapeHtml(d.courseName)}<br>
    <strong>Termin:</strong> ${escapeHtml(d.dateRange)}<br>
    <strong>Lokacija:</strong> ${escapeHtml(d.location)}<br>
    <strong>Cena:</strong> €${d.priceInEuros}</p>

    <p style="margin:16px 0 0;"><strong>Stranka:</strong><br>
    ${escapeHtml(d.customerName)}<br>
    <a href="mailto:${escapeHtml(d.customerEmail)}" style="color:#d3a356;">${escapeHtml(d.customerEmail)}</a><br>
    <a href="tel:${escapeHtml(phoneHref)}" style="color:#d3a356;">${escapeHtml(d.customerPhone)}</a></p>

    <p style="margin:16px 0 0;"><strong>Opomba:</strong><br>
    ${note ? escapeHtml(note).replace(/\n/g, "<br>") : "Brez opombe."}</p>

    <div style="margin:20px 0 0;padding:14px 16px;background:#fff7e8;border:1px solid #efd7aa;">
      <p style="margin:0 0 8px;font-weight:600;">Pomembno</p>
      <ul style="margin:0;padding-left:20px;">
        <li>Prijava še ni potrjena.</li>
        <li>Plačilo/račun še ni urejen.</li>
        <li>Oseba ni samodejno dodana na Brevo seznam udeležencev ali alumni seznam.</li>
        <li>Po potrditvi in plačilu jo ročno dodajte na ustrezen seznam oziroma uredite po svojem postopku.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
