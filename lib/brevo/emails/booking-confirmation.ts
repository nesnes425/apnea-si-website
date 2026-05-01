import { siteConfig } from "@/lib/config";
import { escapeHtml, splitName } from "@/lib/utils";

export type BookingConfirmationData = {
  customerName: string;
  customerEmail: string;
  courseName: string;
  dateRange: string;
  location: string;
  priceInEuros: number;
  paymentIntentId: string;
};

export function bookingConfirmationEmail(d: BookingConfirmationData) {
  const { first: firstName } = splitName(d.customerName);
  const subject = `Potrjeno: ${d.courseName}, ${d.dateRange}`;

  const text = `Pozdravljeni, ${firstName || d.customerName},

vaša prijava na ${d.courseName} je potrjena. Veselimo se srečanja na bazenskem delu tečaja, kjer izveste tudi vse o globinskem delu.

VAŠ TERMIN
${d.courseName}
${d.dateRange}, ${d.location}
Bazenski del

Cena: €${d.priceInEuros} (plačano)
Številka transakcije: ${d.paymentIntentId}

KAJ PRINESTI
Na bazenski del tečaja prinesite kopalke in brisačo. Potrebovali boste tudi neopren, plavutke, masko in uteži. Če katerega kosa opreme nimate, si ga lahko izposodite v trgovini Aquamanija — povejte, da greste na tečaj Apnea Slovenija.

GLOBINSKI DEL
Globinski del (morje) se izvaja maj–avgust. Vse podrobnosti — termin, lokacijo, opremo — uredimo na bazenskem delu tečaja.

PRESTAVITEV ALI ODPOVED
Termin lahko prestavite ali odpovete brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno. Če tečaj odpovemo mi (vreme, nepredvidljive okoliščine), se dogovorimo za nov termin ali vračilo.

VPRAŠANJA
Pišite nam na ${siteConfig.email} ali pokličite ${siteConfig.phone}.

Se vidimo pod vodo,
Samo Jeranko
Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>Pozdravljeni, <strong>${escapeHtml(firstName || d.customerName)}</strong>,</p>
    <p>vaša prijava na <strong>${escapeHtml(d.courseName)}</strong> je potrjena. Veselimo se srečanja na bazenskem delu tečaja, kjer izveste tudi vse o globinskem delu.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Vaš termin</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:600;">${escapeHtml(d.courseName)}</p>
    <p style="margin:0 0 4px;">${escapeHtml(d.dateRange)}, ${escapeHtml(d.location)}</p>
    <p style="margin:0 0 16px;color:#8a8377;font-size:14px;">Bazenski del</p>
    <p style="margin:0;">Cena: <strong>€${d.priceInEuros}</strong> (plačano)<br>
    <span style="color:#8a8377;font-size:13px;">Številka transakcije: ${escapeHtml(d.paymentIntentId)}</span></p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Kaj prinesti</p>
    <p>Na bazenski del tečaja prinesite kopalke in brisačo. Potrebovali boste tudi neopren, plavutke, masko in uteži. Če katerega kosa opreme nimate, si ga lahko izposodite v trgovini <strong>Aquamanija</strong> — povejte, da greste na tečaj Apnea Slovenija.</p>

    <p style="margin:24px 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Globinski del</p>
    <p>Globinski del (morje) se izvaja maj–avgust. Vse podrobnosti — termin, lokacijo, opremo — uredimo na bazenskem delu tečaja.</p>

    <p style="margin:24px 0 6px;font-size:13px;letter-spacing:0.05em;color:#8a8377;text-transform:uppercase;">Prestavitev ali odpoved</p>
    <p>Termin lahko prestavite ali odpovete brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno. Če tečaj odpovemo mi (vreme, nepredvidljive okoliščine), se dogovorimo za nov termin ali vračilo.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0 0 4px;">Vprašanja?</p>
    <p style="margin:0;">
      <a href="mailto:${siteConfig.email}" style="color:#d3a356;text-decoration:none;">${siteConfig.email}</a>
      &nbsp;·&nbsp;
      <a href="tel:${siteConfig.phone.replace(/\s/g, "")}" style="color:#d3a356;text-decoration:none;">${siteConfig.phone}</a>
    </p>

    <p style="margin:32px 0 0;">Se vidimo pod vodo,<br>
    <strong>Samo Jeranko</strong><br>
    <span style="color:#8a8377;">Apnea Slovenija</span></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
