import {createHash} from "node:crypto";
import {z} from "zod";

export function compact(value: string) { return value.replace(/\s/g, "").toUpperCase(); }
export function mod97(value: string) {
  let remainder = 0;
  for (const char of value) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    if (!/^\d+$/.test(digits)) throw new Error("Invalid reference characters");
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}
export function validIban(input: string) {
  const iban = compact(input);
  return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban) && mod97(iban.slice(4) + iban.slice(0,4)) === 1;
}
export function bankReference(id: string) {
  const payload = createHash("sha256").update(`tuition-full-season:${id}`).digest("hex").slice(0,20).toUpperCase();
  return `RF${String(98 - mod97(payload + "RF00")).padStart(2,"0")}${payload}`;
}
export const bankEntrySchema = z.object({
  account: z.string().max(34).refine(validIban),
  bankId: z.string().max(200),
  reference: z.string().max(100),
  amountCents: z.number().int().nonnegative().max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  direction: z.enum(["CRDT", "DBIT"]),
  status: z.string().max(30),
  reversal: z.boolean(),
  bookedOn: z.iso.date(),
  issue: z.string().max(200).optional(),
}).strict();
export type BankEntry = z.infer<typeof bankEntrySchema>;
export const bankImportSchema = z.object({
  fileHash: z.string().regex(/^[a-f0-9]{64}$/),
  format: z.enum(["camt.053.001.02", "camt.053.001.08"]),
  entries: z.array(bankEntrySchema).max(2000),
}).strict();
export function entryKey(entry: BankEntry) {
  if (!entry.bankId || ["NOTPROVIDED", "NONREF"].includes(compact(entry.bankId))) throw new Error("Missing stable bank transaction ID");
  return createHash("sha256").update(`${compact(entry.account)}\n${entry.bankId}`).digest("hex");
}
export function entryFingerprint(entry: BankEntry) {
  // Fixed property order; file name, statement ID and upload time are irrelevant.
  return createHash("sha256").update(JSON.stringify(bankEntrySchema.parse(entry))).digest("hex");
}
export function bankMatchIssue(entry: BankEntry, expectedAccount: string, amount: number) {
  if (compact(entry.account) !== compact(expectedAccount)) return "wrong_account";
  if (entry.issue) return "unsupported_entry";
  if (!entry.bankId || ["NOTPROVIDED", "NONREF"].includes(compact(entry.bankId))) return "missing_bank_id";
  if (entry.direction !== "CRDT" || entry.status !== "BOOK" || entry.reversal) return "not_booked_credit";
  if (entry.currency !== "EUR") return "wrong_currency";
  if (entry.amountCents !== amount) return "amount_mismatch";
  return null;
}
