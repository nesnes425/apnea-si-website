import {siteConfig} from "@/lib/config";
import {agreementNotice, displayDate, euro, type TuitionPlan} from "./plan";
import {bankReference} from "./bank-model";

export function upnDetails(plan: TuitionPlan, sample = false) {
  return {
    ...siteConfig.tuitionBank,
    iban: sample ? "[IBAN društva - v vzorcu ni za plačilo]" : siteConfig.tuitionBank.iban,
    reference: sample ? "[osebni sklic]" : bankReference(plan.id),
    amountCents: plan.first.amountCents + (plan.second?.amountCents ?? 0),
    purpose: `Vadnina 2026/27 - ${plan.participant}`,
    deadline: displayDate(plan.firstPaymentDeadline),
    payer: plan.payer,
  };
}
export function combinedInvitation(plan: TuitionPlan, paymentUrl: string, sample = false) {
  if (!plan.second) throw new Error("Combined invitation requires two approved instalments");
  const upn = upnDetails(plan, sample);
  const subject = "Vadnina 2026/27 – izberite način plačila";
  const text = [
    ...(sample ? ["VZOREC – NI ZA PLAČILO", ""] : []),
    "Pozdravljeni,", "",
    `za ${sample ? "[ime in priimek]" : plan.participant} znaša vadnina za sezono 2026/27 skupaj ${euro(upn.amountCents)}. Izberete lahko eno od dveh možnosti:`,
    "",
    "1. Plačilo s kartico v dveh obrokih",
    `Prvi obrok ${euro(plan.first.amountCents)} plačate prek spodnje povezave do ${upn.deadline}. Kartica se bremeni takoj, ko potrdite plačilo; ne čaka do roka plačila.`,
    `Drugi obrok ${euro(plan.second.amountCents)} se samodejno zaračuna na isto kartico ${displayDate(plan.second.chargeAt)}. Po drugem obroku se plačila končajo. Odpoved drugega obroka sporočite do ${displayDate(plan.cancellationDeadline)}.`,
    `Plačilo prek Stripa: ${paymentUrl}`, "",
    "2. Bančno nakazilo za celotno sezono",
    `Z UPN v prilogi poravnate celotno vadnino ${euro(upn.amountCents)} v enem znesku do ${upn.deadline}.`,
    "QR kodo na UPN skenirajte v bančni aplikaciji in pred potrditvijo preverite podatke.",
    `Prejemnik: ${upn.name}`, `${upn.address}, ${upn.city}`,
    `IBAN: ${upn.iban}`, `Sklic: ${upn.reference}`, `Koda namena: ${upn.purposeCode}`,
    `Namen: ${upn.purpose}`, "",
    "Prosimo, plačajte samo na en način. Če ste že plačali s kartico, ne poravnajte še celotnega UPN. Če ste nakazali na banko, ne uporabite več Stripe povezave; knjiženje lahko zaznamo šele ob naslednjem uvozu bančnega izpiska.",
    ...(agreementNotice(plan) ? ["", agreementNotice(plan)] : []),
    "", "UPN je plačilni nalog. Uradni račun prejmete po potrditvi plačila.",
    "Za vprašanja ali pomoč odgovorite na to sporočilo.", "", "Lep pozdrav,", "Športno društvo Apnea Slovenija", "info@apnea.si",
  ].join("\n");
  const escape = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[c]!);
  const body = escape(text).replace(/\n/g, "<br>");
  const linkedAgreement = body.replace(escape(siteConfig.tuitionAgreement2026.url), `<a href="${escape(siteConfig.tuitionAgreement2026.url)}">Preberite dogovor o udeležbi na treningih 2026/27</a>`);
  const link = sample ? linkedAgreement : linkedAgreement.replace(escape(paymentUrl), `<a href="${escape(paymentUrl)}">Odprite varno plačilo s kartico</a>`);
  return {subject, text, html: `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="background:#f6f5f2;margin:0;padding:28px;font:16px/1.65 Arial,sans-serif;color:#33404f"><main style="max-width:640px;margin:auto;background:white;padding:36px;border-top:5px solid #d3a356"><p style="font-weight:bold;letter-spacing:2px">APNEA.SI</p>${link}</main></body></html>`};
}
