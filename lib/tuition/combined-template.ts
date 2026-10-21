import {siteConfig} from "@/lib/config";
import {agreementNotice, displayDate, euro, type TuitionPlan} from "./plan";
import {upnDetails} from "./upn-details";
import {upnImageUrl} from "./upn-image";
import {monthlyBankDates} from "./monthly-bank";
export {upnDetails} from "./upn-details";

export function monthlyBankInstructions(plan: TuitionPlan) {
  const monthly = plan.monthlyBankPayments;
  if (!monthly) return [];
  const dates = monthlyBankDates(plan);
  return [
    `V prilogi je UPN za celotno vadnino ${euro(plan.first.amountCents)}. Po dogovoru jo poravnate v ${monthly.count} mesečnih obrokih po ${euro(monthly.amountCents)}, vsak zadnji dan v mesecu. Prvi obrok zapade ${displayDate(dates[0])}, zadnji pa ${displayDate(dates.at(-1)!)}.`,
    `UPN in QR koda vsebujeta celotni znesek. Pred vsakim mesečnim plačilom znesek spremenite na ${euro(monthly.amountCents)}. Pri vseh nakazilih uporabite isti osebni sklic, naveden na UPN; drugih podatkov prejemnika ne spreminjajte.`,
    `Po ${monthly.count} obrokih bo poravnana celotna vadnina ${euro(plan.first.amountCents)}.`,
  ];
}

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[c]!);
export function combinedInvitation(plan: TuitionPlan, paymentUrl: string, sample = false) {
  const upnOnly = plan.invitationFormat === "upn_only";
  const monthly = plan.monthlyBankPayments;
  if (upnOnly && plan.second) throw new Error("UPN-only cannot promise instalments");
  const period = `${displayDate(plan.first.serviceFrom)} – ${displayDate(plan.first.serviceTo)}`;
  const upn = upnDetails(plan, sample);
  const subject = `Vadnina 2026/27 – ${sample ? "Vzorec Član" : plan.participant}`;
  const bankDetails = [
    `Prejemnik: ${upn.name}`, `${upn.address}, ${upn.city}`,
    `IBAN: ${upn.iban}`, `Sklic: ${upn.reference}`, `Koda namena: ${upn.purposeCode}`,
    `Namen: ${upn.purpose}`,
  ].join("\n");
  const paragraphs = [
    ...(sample ? ["VZOREC – NI ZA PLAČILO"] : []),
    `Pozdravljeni ${sample ? "Vzorec Član" : plan.participant},`,
    "še enkrat hvala za vašo udeležbo na treningih!",
    `Za obdobje ${period} vam pošiljamo plačilni nalog za plačilo vadnine v skupnem znesku ${euro(upn.amountCents)}.`,
    ...(!upnOnly ? ["Izberete lahko eno od dveh možnosti plačila:",
    plan.second ? "1. Plačilo s kartico v dveh obrokih" : "1. Enkratno plačilo s kartico",
    plan.second
      ? `Prvi in drugi obrok se poravnata s plačilno kartico. Prvi obrok ${euro(plan.first.amountCents)} bremeni kartico takoj ob potrditvi plačila, drugi obrok ${euro(plan.second.amountCents)} pa samodejno bremeni isto kartico ${displayDate(plan.second.chargeAt)}.`
      : `Vadnino ${euro(plan.first.amountCents)} poravnate s plačilno kartico do ${upn.deadline}. Kartica se bremeni takoj ob potrditvi plačila.`,
    ...(plan.second ? [`Po drugem obroku se plačila končajo. Odpoved udeležbe in s tem drugega obroka sporočite najkasneje do ${displayDate(plan.cancellationDeadline)} na ${siteConfig.email}.`] : []),
    `Povezava na plačilo s kartico: ${paymentUrl}`,
    "2. Nakazilo celotne vadnine s QR kodo"] : ["Nakazilo vadnine s QR kodo"]),
    ...(monthly ? monthlyBankInstructions(plan) : [`Z UPN v prilogi poravnate celotno vadnino ${euro(upn.amountCents)} v enem znesku do ${upn.deadline}.`]),
    "QR kodo skenirajte v bančni aplikaciji in pred potrditvijo preverite podatke.",
    bankDetails,
    ...(upnOnly ? ["Če ste vadnino že poravnali, je ne plačujte ponovno; odgovorite na to sporočilo, da preverimo plačilo."] : ["Prosimo, plačajte samo na en način."]),
    ...(agreementNotice(plan) ? [agreementNotice(plan)] : []),
    "Račun prejmete po potrditvi plačila.",
    `Za dodatna pojasnila smo na voljo na ${siteConfig.email}.`,
    "Hvala za vaše zaupanje!",
    "Lep pozdrav,\nŠD Apnea.Si",
  ];
  const qrUrl = upnImageUrl(plan, sample);
  const htmlParagraph = (s: string) => `<p style="margin:0 0 19px">${escape(s).replace(/\n/g,"<br>")}</p>`;
  const body = paragraphs.map(p => {
    if (p === bankDetails) return `<table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 22px"><tr><td class="bank-details" style="vertical-align:top;padding:0 16px 0 0;overflow-wrap:anywhere">${htmlParagraph(p)}</td><td class="bank-qr" width="204" style="vertical-align:top;text-align:center"><img src="${escape(qrUrl)}" width="204" height="204" alt="${sample ? "Vzorčna QR koda – ni za plačilo" : "UPN QR za plačilo celotne vadnine; na voljo tudi v PDF prilogi"}" style="display:block;width:204px;height:204px;margin:0 auto"><p style="font-size:12px;line-height:1.4;margin:8px 0 0">${sample ? "VZORČNA QR KODA<br>Ni za plačilo" : "UPN QR<br>Skenirajte v bančni aplikaciji"}</p></td></tr></table>`;
    if (/^[12]\. /.test(p) || p === "Nakazilo vadnine s QR kodo") return `<h2 style="font-size:19px;margin:30px 0 12px">${escape(p)}</h2>`;
    if (p === `Povezava na plačilo s kartico: ${paymentUrl}`) {
      const buttonStyle = "display:inline-block;margin-top:12px;background:#33404f;color:#fff;padding:12px 20px;border-radius:4px;font-weight:bold;text-decoration:none";
      return sample ? htmlParagraph(p) : `<p style="margin:0 0 19px">Povezava na plačilo s kartico:<br><a href="${escape(paymentUrl)}" style="${buttonStyle}">Odprite varno plačilo s kartico</a></p>`;
    }
    return htmlParagraph(p).replace(escape(siteConfig.tuitionAgreement2026.url), `<a style="color:#805c22" href="${escape(siteConfig.tuitionAgreement2026.url)}">Preberite dogovor o udeležbi na treningih 2026/27</a>`);
  }).join("");
  return {subject, text:paragraphs.join("\n\n"), html: `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:580px){.email-body{padding:12px!important}.email-main{padding:24px 20px!important}.bank-details,.bank-qr{display:block!important;width:100%!important;padding:0 0 18px!important}.bank-qr img{margin-left:0!important}.bank-qr p{width:204px}}</style></head><body class="email-body" style="background:#f6f5f2;margin:0;padding:24px;font:16px/1.65 Arial,sans-serif;color:#33404f"><main class="email-main" style="max-width:640px;margin:auto;background:white;padding:36px;border-top:5px solid #d3a356"><p style="font-weight:bold;letter-spacing:2px;margin:0 0 30px">APNEA.SI</p>${body}</main></body></html>`};
}
