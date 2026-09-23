// Brevo only accepts phone numbers in international format and rejects the
// whole contact otherwise, which silently kept people off their group list.
// People type Slovenian numbers as 040 123 456, 00386…, (0)41…, and so on.

const DEFAULT_COUNTRY_CODE = "386";

export function normalizePhoneForBrevo(raw: string): string | null {
  const cleaned = (raw ?? "").replace(/[^\d+]/g, "");
  if (!cleaned) return null;
  // A "+" anywhere but the start means two numbers or a stray country code.
  if (cleaned.indexOf("+", 1) !== -1) return null;

  let digits: string;
  if (cleaned.startsWith("+")) {
    digits = cleaned.slice(1).replace(/\D/g, "");
  } else if (cleaned.startsWith("00")) {
    digits = cleaned.slice(2).replace(/\D/g, "");
  } else {
    const local = cleaned.replace(/\D/g, "");
    if (local.startsWith(DEFAULT_COUNTRY_CODE)) {
      digits = local;
    } else {
      // Slovenian national format: 040123456 or 40123456.
      digits = DEFAULT_COUNTRY_CODE + local.replace(/^0+/, "");
    }
  }

  // People write "+386 040 727 825": the national trunk zero must go.
  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    digits = DEFAULT_COUNTRY_CODE + digits.slice(DEFAULT_COUNTRY_CODE.length).replace(/^0+/, "");
  }
  // A country code never starts with zero.
  if (digits.startsWith("0")) return null;
  // Shortest possible international numbers have 8 digits, E.164 allows 15.
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
