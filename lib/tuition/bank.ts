import { trainingStripe } from "@/lib/stripe/training-client";
import { siteConfig } from "@/lib/config";
import { assertTuitionStripe } from "./stripe";
import { bankImportSchema, bankMatchIssue, compact, entryFingerprint, entryKey } from "./bank-model";
import { claimPlan, getPlan, patchPlan, releasePlan, tuitionDb, type PlanRecord } from "./store";
import type { z } from "zod";

export function assertBankEnabled() {
  if (process.env.TUITION_BANK_ENABLED !== "true") throw new Error("Bank reconciliation is not enabled");
}

// Customer IDs are unique per obligation. Never refund or mark an invoice paid
// out-of-band: that would masquerade as a card instalment in existing webhooks.
export async function stopBankCardCollection(record: PlanRecord) {
  await assertTuitionStripe(record.manifest.mode);
  if (!record.customer_id || record.first_payment_flow !== "stripe_invoice" || !record.bank_entry_key || !record.cancelled_at)
    throw new Error("Bank payment has not been reserved");
  let conflict = Boolean(record.first_payment_id);
  // Stop future charges before touching invoices (a paid first invoice is normal
  // in a double-payment incident and must never prevent schedule cancellation).
  for await (const schedule of trainingStripe.subscriptionSchedules.list({customer: record.customer_id, limit: 100})) {
    if (schedule.metadata?.planId !== record.id || schedule.livemode !== (record.manifest.mode === "live"))
      throw new Error("Unexpected schedule on obligation customer");
    if (schedule.status === "released") throw new Error("Released subscription requires manual reconciliation");
    if (["active", "not_started"].includes(schedule.status)) {
      const closed = await trainingStripe.subscriptionSchedules.cancel(schedule.id, {invoice_now: false, prorate: false});
      if (closed.status !== "canceled") throw new Error("Schedule cancellation not confirmed");
    }
  }
  if (record.checkout_id) throw new Error("Legacy checkout requires manual bank reconciliation");
  for await (const invoice of trainingStripe.invoices.list({customer: record.customer_id, limit: 100})) {
    const metadata = invoice.metadata?.planId ?? invoice.parent?.subscription_details?.metadata?.planId;
    if (metadata !== record.id || invoice.livemode !== (record.manifest.mode === "live"))
      throw new Error("Unexpected invoice on obligation customer");
    if (invoice.status === "paid" || invoice.amount_paid > 0) conflict = true;
    else if (invoice.status === "draft") await trainingStripe.invoices.del(invoice.id);
    else if (invoice.status === "open" || invoice.status === "uncollectible") {
      // An in-flight card payment can race the void. A failed/ambiguous void
      // remains pending and is re-read on recovery, never declared settled.
      const closed = await trainingStripe.invoices.voidInvoice(invoice.id);
      if (closed.status !== "void") throw new Error("Invoice closure not confirmed");
    }
  }
  // Re-read the provider after closing links. Even a delayed webhook cannot hide
  // a charge which already succeeded; processing/authorised payments need review.
  for await (const intent of trainingStripe.paymentIntents.list({customer: record.customer_id, limit: 100})) {
    if (intent.livemode !== (record.manifest.mode === "live")) throw new Error("Payment mode mismatch");
    if (["succeeded", "processing", "requires_capture", "requires_action", "requires_confirmation"].includes(intent.status)) conflict = true;
    else if (intent.status !== "canceled") throw new Error("Payment intent remains payable; review closure");
  }
  return conflict;
}

export async function reconcileBankPlan(record: PlanRecord) {
  if (!record.bank_entry_key || !record.bank_state) throw new Error("Missing bank evidence");
  try {
    const conflict = await stopBankCardCollection(record);
    const additional = await tuitionDb<{entry_key: string}[]>(`tuition_bank_entries?plan_id=eq.${record.id}&entry_key=neq.${record.bank_entry_key}&limit=1`);
    const review = conflict || record.bank_state === "review" || additional.length > 0;
    const reason = conflict ? "card_payment_also_present" : review ? "operator_review_required" : null;
    await tuitionDb(`tuition_bank_entries?entry_key=eq.${record.bank_entry_key}`, "PATCH", {state: review ? "review" : "paid", reason});
    await patchPlan(record, {bank_state: review ? "review" : "paid", cancellation_confirmed: true,
      error: review ? "Bank/card payment requires operator review; no automatic refund" : null});
    return {processed: record.id, problems: review ? ["Bank payment requires review"] : [], accounting: "review"};
  } catch {
    await patchPlan(record, {bank_state: "pending", error: "Bank received; Stripe closure pending. Inspect before confirming settlement."});
    return {processed: record.id, problems: ["Bank received; Stripe closure pending"], accounting: "review"};
  }
}

type ImportInput = z.infer<typeof bankImportSchema>;
export async function importBankStatement(input: ImportInput, apply: boolean) {
  if (apply) assertBankEnabled();
  const results: {index: number; state: string; reason?: string; planId?: string}[] = [];
  const start = Date.now();
  for (const [index, entry] of input.entries.entries()) {
    // Bound a request; rerunning the same file safely resumes all remaining rows.
    if (Date.now() - start > 35_000) { results.push({index, state: "deferred", reason: "retry_same_file"}); continue; }
    if (entry.issue || compact(entry.account) !== siteConfig.tuitionBank.iban || !/^RF\d{2}[A-Z0-9]{1,21}$/.test(entry.reference)) {
      results.push({index, state: "review", reason: "unsupported_entry_account_or_reference"}); continue;
    }
    const plans = await tuitionDb<PlanRecord[]>(`tuition_plans?bank_reference=eq.${encodeURIComponent(entry.reference)}&limit=2`);
    if (plans.length !== 1) { results.push({index, state: "review", reason: "unknown_reference"}); continue; }
    const plan = plans[0];
    if (plan.cancelled_at && !plan.bank_state) {
      results.push({index, state: "review", reason: "previously_cancelled_plan", planId: plan.id}); continue;
    }
    const issue = bankMatchIssue(entry, plan.bank_iban ?? "", plan.bank_amount_cents ?? 0);
    if (issue || plan.manifest.mode !== "live") { results.push({index, state: "review", reason: issue ?? "not_live", planId: plan.id}); continue; }
    const key = entryKey(entry), fp = entryFingerprint(entry);
    const existing = await tuitionDb<{fingerprint: string; state: string}[]>(`tuition_bank_entries?entry_key=eq.${key}&limit=1`);
    if (existing[0] && (existing[0].fingerprint !== fp ||
      (existing[0].state !== "pending" && plan.bank_state !== "pending" && plan.cancellation_confirmed))) {
      results.push({index, planId: plan.id, state: existing[0].fingerprint === fp ? existing[0].state : "review",
        ...(existing[0].fingerprint !== fp ? {reason: "bank_identity_conflict"} : {})});
      continue;
    }
    if (!apply) {
      results.push({index, planId: plan.id, state: existing[0] ? (existing[0].fingerprint === fp ? (plan.bank_state ?? existing[0].state) : "review") : "matched",
        ...(existing[0] && existing[0].fingerprint !== fp ? {reason: "bank_identity_conflict"} : {})});
      continue;
    }
    let locked: PlanRecord | undefined;
    try {
      locked = await claimPlan(plan.id);
      await tuitionDb("rpc/tuition_accept_bank_entry", "POST", {target_plan: plan.id, token: locked.lease_token, k: key, fp, fh: input.fileHash, e: entry});
      Object.assign(locked, await getPlan(plan.id));
      await reconcileBankPlan(locked);
      results.push({index, planId: plan.id, state: locked.bank_state!, ...(locked.error ? {reason: locked.error} : {})});
    } catch {
      results.push({index, planId: plan.id, state: "review", reason: "busy_or_conflicting_evidence_retry_after_inspection"});
    } finally { if (locked) await releasePlan(locked); }
  }
  return {fileHash: input.fileHash, applied: apply, results};
}
