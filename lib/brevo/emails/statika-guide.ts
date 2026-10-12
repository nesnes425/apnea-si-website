import { siteConfig } from "@/lib/config";
import { escapeHtml } from "@/lib/utils";

export const STATIKA_GUIDE_PATH = "/prirocniki/trening-statike.pdf";

export type StatikaGuideEmailData = {
  firstName: string;
};

// The guide is linked, not attached: Brevo deliverability is better without
// attachments, and the PDF stays replaceable without touching this email.
export function statikaGuideEmail(d: StatikaGuideEmailData) {
  const guideUrl = `${siteConfig.url}${STATIKA_GUIDE_PATH}`;
  const subject = "Vaš priročnik: Trening statike v 8 tednih";
  const greeting = d.firstName ? `Pozdravljeni ${d.firstName},` : "Pozdravljeni,";

  const text = `${greeting}

hvala za zanimanje. Priročnik za 8-tedenski trening statike prenesete tukaj:
${guideUrl}

V priročniku najdete ozadje CO2 in O2 treninga, navodila za varno vadbo in podroben 8-tedenski plan treningov. Pred prvim treningom preberite poglavje o varni vadbi.

Če želite zadrževanje sape vaditi pod vodstvom trenerja, se nam pridružite na vodenih treningih: ${siteConfig.url}/treningi

Lep pozdrav,
Samo Jeranko
Apnea Slovenija`;

  const html = `<!doctype html>
<html lang="sl">
<body style="margin:0;padding:24px;background:#f7f5f2;color:#33404f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px 28px;">
    <p>${escapeHtml(greeting)}</p>
    <p>hvala za zanimanje. Priročnik za 8-tedenski trening statike je pripravljen za vas.</p>

    <p style="margin:28px 0;text-align:center;">
      <a href="${guideUrl}" style="display:inline-block;background:#d3a356;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;">Prenesite priročnik (PDF)</a>
    </p>

    <p>V priročniku najdete ozadje CO2 in O2 treninga, navodila za varno vadbo in podroben 8-tedenski plan treningov. Pred prvim treningom preberite poglavje o varni vadbi.</p>

    <hr style="border:none;border-top:1px solid #e5e0d8;margin:28px 0;">

    <p style="margin:0;">Če želite zadrževanje sape vaditi pod vodstvom trenerja, se nam pridružite na <a href="${siteConfig.url}/treningi" style="color:#d3a356;text-decoration:none;">vodenih treningih</a>.</p>

    <p style="margin:32px 0 0;">Lep pozdrav,<br>
    <strong>Samo Jeranko</strong><br>
    <span style="color:#8a8377;">Apnea Slovenija</span></p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
