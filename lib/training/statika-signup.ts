import { createHash } from "node:crypto";
import type { TransactionalEmail } from "@/lib/brevo/client";
import { statikaSignupCustomerEmail, statikaSignupNotificationEmail, type StatikaEmailData } from "@/lib/brevo/emails/statika-signup";
import type { ConfirmAdditionalSpotResult } from "@/lib/sanity/training-holds";
import type { TrainingGroup } from "@/lib/sanity/types";
import { additionalGroupMarker, decideTrainingSignup, isSamePerson, seasonStartUnix, type PaidTrainingMembership } from "./membership-check";
import { statikaSignupSchema, type StatikaSignupInput } from "./statika-signup-schema";

export type StatikaSignupResult =
  | { ok: true; kind: "confirmed" | "pending_review"; requestId: string; customerEmailSent: boolean; contactAdded: boolean; preview?: true }
  | { ok: false; error: string; spotReserved?: true };

export type StatikaSignupDeps = {
  statikaGroupId: string;
  notifyEmail: string;
  siteEmail: string;
  getSettings(): Promise<{ applicationsOpen: boolean; seasonLabel?: string } | null>;
  getGroup(id: string): Promise<TrainingGroup | null>;
  findMemberships(email: string, since: number): Promise<PaidTrainingMembership[]>;
  confirmSpot(input: { groupId: string; marker: string }): Promise<ConfirmAdditionalSpotResult>;
  addContact(input: { group: TrainingGroup; fullName: string; email: string; phone: string }): Promise<void>;
  // Resolves only on provider acceptance, or its documented response that the
  // same idempotency key was already processed. Neither proves inbox delivery.
  sendEmail(email: TransactionalEmail): Promise<void>;
};

export function statikaEmailKey(value: string): string {
  const bytes = createHash("sha256").update(`apnea-statika-v1\n${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isStatikaEmailReplay(error: { status: number; providerCode: string | null; message: string }): boolean {
  return error.status === 400 && error.providerCode === "duplicate_parameter"
    && error.message.includes("Email for the idempotency key has already been processed");
}

export function statikaPreviewAllowed(input: { enabled?: string; nodeEnv?: string; vercel?: string; host: string }): boolean {
  return input.enabled === "true" && input.nodeEnv === "development" && !input.vercel
    && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(input.host);
}

function full(group: TrainingGroup) {
  const activeHolds = (group.holds ?? []).filter((hold) => new Date(hold.expiresAt).getTime() > Date.now()).length;
  return group.confirmedSpots + activeHolds >= group.capacity;
}

export async function processStatikaSignup(raw: StatikaSignupInput, deps: StatikaSignupDeps): Promise<StatikaSignupResult> {
  const parsed = statikaSignupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  const data = parsed.data;
  if (data.groupId !== deps.statikaGroupId) return { ok: false, error: "Ta možnost prijave velja samo za statiko v Tivoliju." };

  let settings: Awaited<ReturnType<StatikaSignupDeps["getSettings"]>>;
  let group: TrainingGroup | null;
  try {
    [settings, group] = await Promise.all([deps.getSettings(), deps.getGroup(data.groupId)]);
  } catch {
    return { ok: false, error: "Prijave trenutno ni mogoče preveriti. Poskusite znova." };
  }
  if (!settings?.applicationsOpen) return { ok: false, error: "Spletne prijave so trenutno zaprte. Pišite nam na info@apnea.si." };
  if (!group?.active || !group.program?.active || !group.venue?.active) return { ok: false, error: "Izbrana skupina ni več na voljo." };
  if (group.weekday !== "sreda" || group.startTime !== "20:45" || group.endTime !== "21:45") return { ok: false, error: "Termin statike se je spremenil. Pišite nam na info@apnea.si." };
  if (!settings.seasonLabel?.match(/^\d{4}\/\d{2}$/)) return { ok: false, error: "Sezona prijav trenutno ni pravilno nastavljena. Pišite nam na info@apnea.si." };

  let memberships: PaidTrainingMembership[] = [];
  let lookupUnavailable = false;
  try {
    memberships = await deps.findMemberships(data.email, seasonStartUnix(settings.seasonLabel));
  } catch {
    lookupUnavailable = true;
  }
  const decision = decideTrainingSignup({ groupId: group._id, customerName: data.fullName, memberships, groupConfirmedIds: group.confirmedPaymentIntentIds ?? [] });
  const own = memberships.filter((membership) => isSamePerson(membership.customerName, data.fullName));
  if (own.some((membership) => membership.groupId === group._id)) {
    return { ok: false, error: "Za ta termin je vaša prijava že zabeležena. Za preverjanje nam pišite na info@apnea.si." };
  }
  const replayMembership = own.find((membership) => membership.status === "succeeded" && group.confirmedPaymentIntentIds?.includes(additionalGroupMarker(membership.paymentIntentId)));
  const membershipPaymentIntentId = decision.kind === "additional_group" ? decision.membershipPaymentIntentId : replayMembership?.paymentIntentId;
  // An existing marker may retry missing follow-ups even when the group is now
  // full. Everyone else must pass the same capacity check before any writes.
  if (full(group) && !replayMembership) return { ok: false, error: "Izbrana skupina je polna. Pišite nam na info@apnea.si." };

  const kind = membershipPaymentIntentId ? "confirmed" : "pending_review";
  if (membershipPaymentIntentId) {
    let confirmation: ConfirmAdditionalSpotResult;
    try {
      confirmation = await deps.confirmSpot({ groupId: group._id, marker: additionalGroupMarker(membershipPaymentIntentId) });
    } catch {
      return { ok: false, error: "Rezervacije trenutno ni mogoče potrditi. Ponovite oddajo; iste prijave ne bomo šteli ponovno." };
    }
    if (!confirmation.ok) return { ok: false, error: confirmation.reason === "full" ? "Izbrana skupina je polna." : "Mesta trenutno ni mogoče rezervirati. Poskusite znova." };
  }
  // Bind email replay protection to the submitted contact data. A visitor may
  // correct a field after an uncertain response while retaining the form UUID;
  // acceptance of the old payload must not suppress those corrected details.
  const contactFingerprint = statikaEmailKey(JSON.stringify([
    data.fullName.normalize("NFC").replace(/\s+/g, " "), data.email,
    data.phone.replace(/\s+/g, " "), group._id, settings.seasonLabel,
  ]));
  const requestId = membershipPaymentIntentId
    ? statikaEmailKey(`${settings.seasonLabel}\n${group._id}\n${membershipPaymentIntentId}`)
    : statikaEmailKey(`pending\n${data.requestId}\n${contactFingerprint}`);
  const groupLabel = `${group.program.name}, ${group.venue.name}, sreda ${group.startTime}–${group.endTime}`;
  const emailData: StatikaEmailData = { ...data, requestId, groupId: group._id, season: settings.seasonLabel, groupLabel, kind, membershipPaymentIntentId, lookupUnavailable };
  const notification = statikaSignupNotificationEmail(emailData);
  try {
    await deps.sendEmail({
      ...notification, to: { email: deps.notifyEmail }, replyTo: { email: data.email, name: data.fullName },
      idempotencyKey: statikaEmailKey(`${kind}\n${requestId}\n${contactFingerprint}\nadmin\n${deps.notifyEmail.toLowerCase()}`),
    });
  } catch {
    return membershipPaymentIntentId
      ? { ok: false, spotReserved: true, error: "Mesto je rezervirano, obvestila pa ni bilo mogoče oddati. Ponovite oddajo; mesta ne bomo šteli ponovno. Če težava ostane, nam pišite na info@apnea.si." }
      : { ok: false, error: "Zahteve ni bilo mogoče oddati. Poskusite znova ali nam pišite na info@apnea.si." };
  }

  // Admin email is the recoverable private record. Optional follow-up failures
  // must not ask the visitor to create a second application. No public CMS PII.
  let contactAdded = false;
  if (membershipPaymentIntentId) {
    try {
      await deps.addContact({ group, fullName: data.fullName, email: data.email, phone: data.phone });
      contactAdded = true;
    } catch { /* Admin notification contains the data needed for reviewed repair. */ }
  }
  let customerEmailSent = false;
  try {
    await deps.sendEmail({
      ...statikaSignupCustomerEmail(emailData), to: { email: data.email, name: data.fullName }, replyTo: { email: deps.siteEmail, name: "Apnea Slovenija" },
      idempotencyKey: statikaEmailKey(`${kind}\n${requestId}\n${contactFingerprint}\ncustomer\n${data.email}`),
    });
    customerEmailSent = true;
  } catch { /* The returned flag keeps the on-screen result accurate. */ }
  return { ok: true, kind, requestId, customerEmailSent, contactAdded };
}

