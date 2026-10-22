import {qrcodegen} from "@/lib/vendor/qrcodegen";
import {compact, mod97, validIban} from "./bank-model";
import {upnDetails} from "./upn-details";
import type {TuitionPlan} from "./plan";
import {upnDeadline} from "./monthly-bank";

// ZBS UPN QR technical standard v1.1, section 5: ISO 8859-2, ECI 4,
// binary segments, fixed V15 / ECC M, 19 LF-terminated fields + length checksum.
// Reverse the platform decoder so unsupported characters cannot become '?'.
const decoder = new TextDecoder("iso-8859-2", {fatal:true});
const alphabet = new Map(Array.from({length:256}, (_,n) => [decoder.decode(Uint8Array.of(n)),n] as const));
export function iso88592(text: string) {
  return Uint8Array.from(Array.from(text, char => {
    const byte = alphabet.get(char);
    if (byte === undefined) throw new Error("UPN QR contains a character outside ISO 8859-2; review payer details");
    return byte;
  }));
}
function field(value: string) {
  if (!value || value !== value.trim() || /[\u0000-\u001f\u007f-\u009f]/.test(value))
    throw new Error("UPN QR fields must be nonempty, single-line and trimmed");
  iso88592(value);
  return value;
}
export function upnPayload(plan: TuitionPlan) {
  const p = upnDetails(plan);
  if (!validIban(p.iban) || compact(p.iban) !== p.iban) throw new Error("Invalid UPN IBAN");
  if (!/^RF\d{2}[A-Z0-9]{1,21}$/.test(p.reference) || mod97(p.reference.slice(4)+p.reference.slice(0,4)) !== 1)
    throw new Error("Invalid UPN creditor reference");
  if (!Number.isSafeInteger(p.amountCents) || p.amountCents <= 0 || p.amountCents > 99_999_999_999)
    throw new Error("Invalid UPN amount");
  if (!/^[A-Z]{4}$/.test(p.purposeCode)) throw new Error("Invalid UPN purpose code");
  const date = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Ljubljana",day:"2-digit",month:"2-digit",year:"numeric"})
    .format(new Date(upnDeadline(plan))).replaceAll("/", ".");
  // Only the explicit SI generic-consumer exception may leave payer address lines
  // empty. The creditor, payer name and every payment field stay strict.
  const omitted = plan.payer.accountingMode === "generic_consumer_address_omitted";
  if (omitted && (plan.payer.country !== "SI" || [p.payer.address,p.payer.postalCode,p.payer.city].some(v => v !== "")))
    throw new Error("Invalid omitted payer address");
  const fields = ["UPNQR", "", "", "", "", field(p.payer.name), omitted ? "" : field(p.payer.address),
    omitted ? "" : field(`${p.payer.postalCode} ${p.payer.city}`), String(p.amountCents).padStart(11,"0"), "", "",
    p.purposeCode, field(p.purpose), date, p.iban, p.reference, field(p.name), field(p.address), field(p.city)];
  const prefix = fields.join("\n") + "\n";
  const payload = prefix + String(iso88592(prefix).length).padStart(3,"0") + "\n";
  if (iso88592(payload).length > 411) throw new Error("UPN QR exceeds 411 bytes; review long payer details without truncation");
  return payload;
}
function encodeTuitionQr(plan: TuitionPlan, sample = false) {
  // The generic preview must never turn into a payable banking instruction.
  const payload = sample ? "VZOREC - NI ZA PLACILO\nAPNEA.SI - vadnina 2026/27" : upnPayload(plan);
  const qr = qrcodegen.QrCode.encodeSegments([
    qrcodegen.QrSegment.makeEci(4), qrcodegen.QrSegment.makeBytes(Array.from(iso88592(payload))),
  ], qrcodegen.QrCode.Ecc.MEDIUM, 15, 15, -1, false);
  return {payload, qr};
}
export function tuitionQrMatrix(plan: TuitionPlan, sample = false) {
  return encodeTuitionQr(plan, sample).qr;
}
export function tuitionQr(plan: TuitionPlan, sample = false) {
  const {payload, qr} = encodeTuitionQr(plan, sample);
  // Vector horizontal runs; four white modules on every edge. 85 x 85 modules
  // rendered at 102pt gives the standard 0.42333mm module pitch at print size.
  let path = "";
  for (let y=0;y<qr.size;y++) for (let x=0;x<qr.size;) {
    if (!qr.getModule(x,y)) {x++;continue;}
    const start=x;
    while (x<qr.size && qr.getModule(x,y)) x++;
    path += `M${start+4},${y+4}h${x-start}v1h-${x-start}z`;
  }
  return {payload,path,size:qr.size,version:qr.version};
}
