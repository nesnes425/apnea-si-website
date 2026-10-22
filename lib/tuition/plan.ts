import { createHash } from "node:crypto";
import { z } from "zod";
import { siteConfig } from "../config";
import {monthEnd} from "./monthly-bank";

export const CLUB_STRIPE_ACCOUNT = "acct_1TfaIdEJ7wtq3TXq";
export const TUITION_TYPE = "training_tuition";
const date = z.iso.date();
const instalment = z
  .object({
    amountCents: z.number().int().positive().max(1_000_000),
    serviceFrom: date,
    serviceTo: date,
  })
  .strict()
  .refine((v) => v.serviceFrom <= v.serviceTo, "Invalid service period");

// An approved obligation, never an inferred percentage or a participant/email key.
export const planSchema = z
  .object({
    id: z.uuid(),
    payerId: z.uuid(),
    mode: z.enum(["test", "live"]),
    source: z
      .object({
        spreadsheetId: z.literal(
          "1WiIeVtQgJR0gKKOEt2-4ZLrJfdJ-AuozVWY0kMpWqHM",
        ),
        row: z.number().int().min(2),
        obligationId: z.string().min(8).max(100),
      })
      .strict(),
    payer: z
      .object({
        name: z.string().min(2).max(150),
        email: z.email(),
        address: z.string().min(3).max(200),
        postalCode: z.string().min(2).max(20),
        city: z.string().min(2).max(100),
        country: z.enum(["SI", "IT"]),
      })
      .strict(),
    participant: z.string().min(2).max(150),
    locationCode: z.string().regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/),
    description: z.string().min(3).max(200),
    // Optional so existing fingerprints remain unchanged. Bank-only invitations
    // retain an unsent Stripe draft for the existing reconciliation workflow.
    invitationFormat: z.literal("upn_only").optional(),
    // Explicitly reviewed bank-only schedule. The UPN still carries the full total.
    monthlyBankPayments: z.object({
      amountCents: z.number().int().positive().max(1_000_000),
      count: z.number().int().min(2).max(12),
      firstMonth: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
    }).strict().optional(),
    first: instalment,
    second: instalment
      .safeExtend({ chargeAt: z.iso.datetime({ offset: true }) })
      .optional(),
    firstPaymentDeadline: z.iso.datetime({ offset: true }),
    cancellationDeadline: date,
    // Absent on legacy plans: never change their stored fingerprint or notice.
    agreementNoticeVersion: z.literal("2026-27-v1").optional(),
    approval: z
      .object({
        approvedBy: z.string().min(2).max(100),
        approvedAt: z.iso.datetime({ offset: true }),
        agreementSigned: z.boolean(),
        exceptionsResolved: z.literal(true),
        noPreviousPaymentOrInvoice: z.literal(true),
        personalPayerOnly: z.literal(true),
        accountingPolicy: z.literal("service_per_instalment"),
      })
      .strict(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.payer.country === "IT" && !/^\d{5}$/.test(p.payer.postalCode))
      ctx.addIssue({code:"custom",path:["payer","postalCode"],message:"Italian postal code must contain five digits"});
    if (p.invitationFormat === "upn_only" && p.second)
      ctx.addIssue({code: "custom", path: ["second"], message: "UPN-only cannot include card instalments"});
    if (p.monthlyBankPayments) {
      const m = p.monthlyBankPayments;
      if (p.invitationFormat !== "upn_only" || p.second || m.amountCents * m.count !== p.first.amountCents)
        ctx.addIssue({code:"custom", path:["monthlyBankPayments"], message:"Monthly bank payments require UPN-only and an exact full-obligation total"});
      const validScheduleDates = /^20\d{2}-(0[1-9]|1[0-2])$/.test(m.firstMonth) && Number.isInteger(m.count) && m.count >= 2 && m.count <= 12 && Number.isFinite(Date.parse(p.firstPaymentDeadline));
      if (validScheduleDates && (m.firstMonth !== p.first.serviceFrom.slice(0,7) || monthEnd(m.firstMonth,m.count-1).slice(0,7) !== p.first.serviceTo.slice(0,7) || displayDate(p.firstPaymentDeadline) !== displayDate(monthEnd(m.firstMonth))))
        ctx.addIssue({code:"custom", path:["monthlyBankPayments"], message:"Monthly bank schedule must cover the service months and first month-end deadline"});
    }
    if (!p.approval.agreementSigned && !p.agreementNoticeVersion)
      ctx.addIssue({
        code: "custom",
        path: ["approval", "agreementSigned"],
        message: "An unsigned agreement requires the versioned notice accepted with payment",
      });
    if (
      p.agreementNoticeVersion &&
      [p.first, ...(p.second ? [p.second] : [])].some(
        (i) => i.serviceFrom < "2026-09-30" || i.serviceTo > "2027-09-30",
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["agreementNoticeVersion"],
        message: "This agreement notice applies only to the 2026/27 season",
      });
    if (
      p.second &&
      Date.parse(p.firstPaymentDeadline) + 86_400_000 >=
        Date.parse(p.second.chargeAt)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "First payment deadline must precede the second charge by more than one day",
      });
    if (p.second && p.cancellationDeadline >= p.second.chargeAt.slice(0, 10))
      ctx.addIssue({
        code: "custom",
        message: "Cancellation deadline must precede the second charge",
      });
  });
export type TuitionPlan = z.infer<typeof planSchema>;
export function tuitionItem(locationCode: string) {
  const mapping = z
    .record(
      z.string(),
      z
        .object({
          stripeProductId: z.string().startsWith("prod_"),
          minimaxItemId: z.number().int().positive().optional(),
        })
        .strict(),
    )
    .parse(JSON.parse(process.env.TUITION_ITEMS_JSON ?? "{}"));
  if (!mapping[locationCode])
    throw new Error(`Missing tuition item mapping for ${locationCode}`);
  return mapping[locationCode];
}
export function fingerprint(plan: TuitionPlan) {
  return createHash("sha256")
    .update(JSON.stringify(planSchema.parse(plan)))
    .digest("hex");
}
export function euro(cents: number) {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
export function displayDate(value: string) {
  return new Intl.DateTimeFormat("sl-SI", {
    timeZone: "Europe/Ljubljana",
  }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}
export function consentText(plan: TuitionPlan) {
  const agreement = agreementNotice(plan);
  return `${agreement ? `${agreement} ` : ""}${paymentConsentText(plan)}`;
}
export function paymentConsentText(plan: TuitionPlan) {
  if (!plan.second)
    return `Soglašam s plačilom vadnine ${euro(plan.first.amountCents)} (udeleženec: ${plan.participant}).`;
  const day = new Intl.DateTimeFormat("sl-SI", {
    timeZone: "Europe/Ljubljana",
  }).format(new Date(plan.second.chargeAt));
  return `Soglašam s plačilom prvega obroka vadnine ${euro(plan.first.amountCents)} (udeleženec: ${plan.participant}), s shranitvijo kartice in z enim samodejnim plačilom drugega obroka ${euro(plan.second.amountCents)} dne ${day}. Po drugem obroku se plačila končajo. Odpoved drugega obroka sporočite društvu do ${displayDate(plan.cancellationDeadline)}.`;
}

export function agreementNotice(plan: TuitionPlan) {
  if (!plan.agreementNoticeVersion) return "";
  const agreement = siteConfig.tuitionAgreement2026;
  return `${agreement.acceptanceText}: ${agreement.url}.`;
}

// This exact statement is shown in Stripe's email, hosted payment page and PDF.
// Paying the displayed request authorizes the described finite card arrangement.
export function invoicePaymentNotice(plan: TuitionPlan) {
  const second = plan.second;
  const notice = [
    `Plačilni poziv za ${second ? "1. obrok vadnine" : "vadnino"}: ${euro(plan.first.amountCents)}.`,
    ...(plan.agreementNoticeVersion ? [agreementNotice(plan)] : []),
    ...(second
      ? [
          `S plačilom soglašate s shranitvijo kartice in enim samodejnim plačilom ${euro(second.amountCents)} dne ${displayDate(second.chargeAt)}.`,
          `Po drugem obroku se plačila končajo. Odpoved sporočite društvu do ${displayDate(plan.cancellationDeadline)}.`,
        ]
      : []),
    "Uradni račun prejmete iz Minimaxa po plačilu.",
    `Pogoji: ${process.env.TUITION_SITE_URL ?? "https://www.apnea.si"}/pogoji.`,
  ].join(" ");
  if (notice.length > 500)
    throw new Error("Stripe payment notice exceeds its limit");
  return notice;
}
export function invoiceConsentHash(plan: TuitionPlan) {
  return createHash("sha256").update(invoicePaymentNotice(plan)).digest("hex");
}
