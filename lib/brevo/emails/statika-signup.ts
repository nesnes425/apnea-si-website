import { siteConfig } from "@/lib/config";
import { escapeHtml } from "@/lib/utils";

export type StatikaEmailData = {
  requestId: string;
  fullName: string;
  email: string;
  phone: string;
  groupId: string;
  season: string;
  groupLabel: string;
  kind: "confirmed" | "pending_review";
  membershipPaymentIntentId?: string;
  lookupUnavailable?: boolean;
};

function emailHtml(title: string, text: string) {
  const paragraphs = text.split("\n\n").map((paragraph) => `<p style="margin:0 0 20px;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f7f5f2;color:#33404f;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#ffffff;"><tr><td style="padding:32px 28px 12px;font-size:15px;line-height:1.6;"><h1 style="margin:0 0 24px;font-size:24px;line-height:1.3;color:#33404f;">${escapeHtml(title)}</h1>${paragraphs}<p style="margin:0 0 20px;"><a href="mailto:${siteConfig.email}" style="color:#33404f;text-decoration:underline;">Pišite nam</a></p></td></tr><tr><td style="padding:20px 28px;background:#f4f4f4;font-size:12px;line-height:1.6;color:#585a5a;">${escapeHtml(siteConfig.tuitionBank.name)}<br>${escapeHtml(siteConfig.tuitionBank.address)}, ${escapeHtml(siteConfig.tuitionBank.city)}</td></tr></table></td></tr></table></body></html>`;
}

export function statikaSignupNotificationEmail(data: StatikaEmailData) {
  const confirmed = data.kind === "confirmed";
  const subject = `${confirmed ? "Nova prijava na dodatni trening" : "Nova zahteva za prijavo na statiko"}: ${data.fullName}`;
  const membership = confirmed
    ? `Članarina: potrjeno obstoječe uspešno plačilo za to sezono.\nStripe: https://dashboard.stripe.com/payments/${data.membershipPaymentIntentId}`
    : `Članarina: prijavitelj potrjuje, da jo je že plačal; to še ni preverjeno.${data.lookupUnavailable ? " Samodejno preverjanje trenutno ni bilo na voljo." : " Ustreznega spletnega plačila nismo našli."}`;
  const text = `${confirmed ? "Prijava na statiko je potrjena. Mesto v Sanityju je že upoštevano." : "Prejeta je zahteva za prijavo na statiko. Mesto še ni potrjeno ali rezervirano."}

Udeleženec: ${data.fullName}
E-pošta: ${data.email}
Telefon: ${data.phone}

Termin: ${data.groupLabel}
Skupina Sanity: ${data.groupId}
Sezona: ${data.season}
ID prijave: ${data.requestId}

${membership}
Novo plačilo: ne. Nov račun: ne.

${confirmed ? "Za administracijo: preverite, ali je oseba že vpisana v statiko, in dodajte manjkajoči vpis v Tabelo vodenih treningov. Ne prestavljajte je iz druge skupine in ne povečujte potrjenih mest v Sanityju ponovno. Preverite tudi Brevo seznam statike, saj je to obvestilo oddano pred poskusom vpisa v Brevo." : "Za administracijo: preverite članarino, identiteto in prosta mesta. Nato po potrjenem postopku uredite vključitev ter vpis v tabelo, Sanity in Brevo. Do potrditve oseba ni vključena v skupino."}

Ponovljeno sporočilo z istim ID prijave ne pomeni novega vpisa. Spletna stran tabele ne posodobi samodejno. Oprostitev ponovnega plačila članarine ne določa vadnine.`;
  return { subject, text, html: emailHtml(confirmed ? "Potrjena prijava na statiko" : "Prijava na statiko čaka preverjanje", text) };
}

export function statikaSignupCustomerEmail(data: StatikaEmailData) {
  const confirmed = data.kind === "confirmed";
  const subject = confirmed ? "Vaša prijava na statiko je potrjena" : "Prejeli smo vašo prijavo na statiko";
  const text = `Pozdravljeni, ${data.fullName}!

${confirmed ? "Vaša prijava na statiko je potrjena. Letno članarino za to sezono ste že plačali, zato je ni treba plačati ponovno." : "Prejeli smo vašo zahtevo za prijavo na statiko brez ponovnega plačila članarine. Preverili bomo že plačano članarino in možnost vključitve ter vam odgovorili. Vaše mesto še ni potrjeno ali rezervirano."}

Termin: ${data.groupLabel}
Sezona: ${data.season}

Ob tej prijavi ni bilo novega plačila. Ta prijava ne spreminja pogojev vadnine.

Referenca prijave: ${data.requestId}
Za vprašanja nam odgovorite na to sporočilo.

Lep pozdrav,
Apnea Slovenija`;
  return { subject, text, html: emailHtml(subject, text) };
}
