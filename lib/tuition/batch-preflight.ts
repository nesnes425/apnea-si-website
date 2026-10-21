import {createHash} from "node:crypto";
import {z} from "zod";
import {fingerprint, planSchema, type TuitionPlan} from "./plan";
import type {PlanRecord, PaymentRecord} from "./store";

export const bankCoverageSchema = z.object({
  sourceRef: z.string().min(8).max(200),
  checkedAt: z.iso.datetime({offset: true}),
  coveredThrough: z.iso.date(),
}).strict();
export const batchPreflightSchema = z.object({
  plans: z.array(planSchema.refine(p => p.mode === "live", "Live approved manifests required")).min(1).max(10),
  bankCoverage: bankCoverageSchema.optional(),
}).strict().superRefine(({plans}, ctx) => {
  if (new Set(plans.map(p => p.id)).size !== plans.length || new Set(plans.map(p => p.source.obligationId)).size !== plans.length)
    ctx.addIssue({code:"custom", message:"Duplicate plan or obligation in batch"});
});
export type BatchPreflightInput = z.infer<typeof batchPreflightSchema>;
export type Check = {status: "clear" | "match" | "conflict" | "incomplete"; references: string[]; reasons: string[]; checkedAt: string; coverage?: {sourceRef: string; checkedAt: string; coveredThrough: string; basis: "operator_statement_coverage"}};
export type ProviderRecord = {
  ref: string;
  kind: "customer" | "invoice" | "payment";
  planId?: string;
  customerId?: string;
  membershipOnly?: boolean;
  tuition?: boolean;
  inactive?: boolean;
  paid?: boolean;
  // Provider service dates, when present, are stronger than creation dates.
  serviceFrom?: string;
  serviceTo?: string;
};
export type RegistrySnapshot = {
  plans: PlanRecord[];
  payments: Pick<PaymentRecord, "id" | "plan_id" | "minimax_id">[];
  deliveries: {id: string; plan_id: string; submission_state: string}[];
  bankEntries: {entry_key: string; plan_id: string; state: string}[];
};
export type ProviderSnapshot = {records: ProviderRecord[]; complete: boolean; scope: string};
export type PreflightEvidence = {
  registry: RegistrySnapshot | null;
  stripe: ProviderSnapshot;
  minimax: ProviderSnapshot;
};
export type PreflightResult = {
  planId: string;
  obligationId: string;
  manifestHash: string;
  planDigest: string;
  disposition: "ready" | "resume" | "skip_paid" | "skip_submitted" | "blocked";
  checks: {registry: Check; stripe: Check; minimax: Check; bank: Check};
};
export function normalize(value: string) { return value.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("sl"); }
export function canonicalPlanDigest(plan: TuitionPlan) {
  const sorted = (v:unknown):unknown => Array.isArray(v) ? v.map(sorted) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted((v as Record<string,unknown>)[k])])) : v;
  return createHash("sha256").update(JSON.stringify(sorted(plan))).digest("hex");
}
export function overlaps(p: TuitionPlan, from?: string, to?: string) {
  // Missing dates never prove the provider record belongs to another season.
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return true;
  return [p.first, ...(p.second ? [p.second] : [])].some(s => s.serviceFrom <= to && s.serviceTo >= from);
}
function check(status: Check["status"], checkedAt: string, references: string[] = [], reasons: string[] = []): Check {
  return {status, checkedAt, references: [...new Set(references)].slice(0,100), reasons};
}
function providerCheck(p: TuitionPlan, evidence: ProviderSnapshot, registry: RegistrySnapshot | null, own: PlanRecord | undefined, checkedAt: string) {
  const relevant = evidence.records.filter(r => !r.inactive && overlaps(p,r.serviceFrom,r.serviceTo));
  const conflicts: string[] = [], matches: string[] = [], excluded: string[] = [];
  for (const r of relevant) {
    if (r.membershipOnly && !r.tuition) { excluded.push(`${r.ref}:membership_only`); continue; }
    if (r.kind === "customer") { matches.push(r.ref); continue; }
    const linkedPayment = registry?.payments.some(payment => payment.plan_id === p.id && (r.ref === `stripe:${payment.id}` || r.ref === `minimax:${payment.minimax_id}`));
    const savedInvoice = own && r.kind === "invoice" && [own.first_invoice_id, own.collection_invoice_id, own.consent_invoice_id].some(id=>id && r.ref === `stripe:${id}`);
    if (own && (linkedPayment || (savedInvoice && !r.paid && r.tuition && r.planId === p.id && r.customerId === own.customer_id))) { matches.push(r.ref); continue; }
    const other = r.planId ? registry?.plans.find(record => record.id === r.planId) : undefined;
    if (other && other.manifest.source.obligationId !== p.source.obligationId && normalize(other.manifest.participant) !== normalize(p.participant)) {
      excluded.push(`${r.ref}:other_participant`); continue;
    }
    conflicts.push(r.ref);
  }
  if (conflicts.length) return check("conflict",checkedAt,[...conflicts,...matches,...excluded],["existing_tuition_or_unclassified_obligation", ...(!evidence.complete ? ["provider_coverage_incomplete"] : [])]);
  if (!evidence.complete) return check("incomplete",checkedAt,[evidence.scope,...matches,...excluded],["provider_coverage_incomplete"]);
  return check(matches.length ? "match" : "clear",checkedAt,[evidence.scope,...matches,...excluded]);
}

// Pure aggregation: no credentials, network, provider writes or clock reads.
export function aggregatePreflight(input: BatchPreflightInput, evidence: PreflightEvidence[], checkedAt: string): {version:1; checkedAt:string; results:PreflightResult[]} {
  const now = Date.parse(checkedAt);
  return {version:1,checkedAt,results:input.plans.map((p,index) => {
    const e = evidence[index];
    if (!e) throw new Error("Missing preflight evidence");
    const hash = fingerprint(p);
    const rows = e.registry?.plans ?? [];
    const exact = rows.find(r => r.id === p.id);
    const own = exact?.fingerprint === hash && fingerprint(exact.manifest) === hash && exact.manifest.source.obligationId === p.source.obligationId ? exact : undefined;
    const conflicting = rows.filter(r => r.id !== p.id && (r.manifest.source.obligationId === p.source.obligationId || (normalize(r.manifest.payer.email) === normalize(p.payer.email) && normalize(r.manifest.participant) === normalize(p.participant) && overlaps(p,r.manifest.first.serviceFrom,r.manifest.second?.serviceTo ?? r.manifest.first.serviceTo))));
    const batchConflicts = input.plans.filter(r => r.id !== p.id && normalize(r.payer.email) === normalize(p.payer.email) && normalize(r.participant) === normalize(p.participant) && overlaps(p,r.first.serviceFrom,r.second?.serviceTo ?? r.first.serviceTo));
    const registry = !e.registry ? check("incomplete",checkedAt,[],["registry_unavailable"])
      : conflicting.length || batchConflicts.length || (exact && !own) ? check("conflict",checkedAt,[...conflicting.map(r=>`plan:${r.id}`),...batchConflicts.map(r=>`batch_plan:${r.id}`),...(exact ? [`plan:${exact.id}`] : [])],["manifest_or_obligation_conflict"])
      : check(own ? "match":"clear",checkedAt,own ? [`plan:${p.id}`,`manifest:${hash}`] : []);
    const stripe = providerCheck(p,e.stripe,e.registry,own,checkedAt);
    const minimax = providerCheck(p,e.minimax,e.registry,own,checkedAt);
    const entries = e.registry?.bankEntries.filter(r=>r.plan_id === p.id) ?? [];
    const coverage = input.bankCoverage;
    const localDay=(timestamp:number)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Ljubljana"}).format(timestamp);
    const yesterday = localDay(now - 86400_000);
    const validCoverage = coverage && Date.parse(coverage.checkedAt) <= now + 60_000 && Date.parse(coverage.checkedAt) >= now - 86400_000 && coverage.coveredThrough >= yesterday && coverage.coveredThrough <= localDay(now);
    let bank: Check = !e.registry ? check("incomplete",checkedAt,[],["bank_register_unavailable"])
      : own?.bank_state === "review" || entries.some(r=>r.state === "review" || r.state === "pending") ? check("conflict",checkedAt,entries.map(r=>`bank:${r.entry_key}`),["bank_entry_needs_reconciliation"])
      : own?.bank_state === "paid" || entries.some(r=>r.state === "paid") ? check("match",checkedAt,entries.map(r=>`bank:${r.entry_key}`))
      : !validCoverage ? check("incomplete",checkedAt,[],["fresh_bank_statement_coverage_required"])
      : check("clear",checkedAt,[`statement:${coverage!.sourceRef}`],["register_absence_does_not_cover_unimported_payments"]);
    if (coverage) bank = {...bank,coverage:{...coverage,basis:"operator_statement_coverage"}};
    const submission = e.registry?.deliveries.find(d=>d.plan_id === p.id && d.submission_state !== "not_sent");
    const paid = own && (own.first_payment_id || own.bank_state === "paid" || entries.some(r=>r.state === "paid") || e.registry?.payments.some(payment=>payment.plan_id === p.id));
    const sent = own && (own.invitation_state === "submitted" || submission?.submission_state === "submitted");
    const unsafe = own && (own.cancelled_at || own.error || own.collection_error || ["sending","uncertain"].includes(own.invitation_state ?? "") || (submission && ["sending","uncertain"].includes(submission.submission_state)));
    if (submission) registry.references.push(`delivery:${submission.id}:${submission.submission_state}`);
    let disposition: PreflightResult["disposition"] = "blocked";
    if (registry.status === "match" && paid) disposition = "skip_paid";
    else if (registry.status === "match" && sent) disposition = "skip_submitted";
    else if (!unsafe && Object.values({registry,stripe,minimax,bank}).every(c=>!["conflict","incomplete"].includes(c.status))) disposition = own ? "resume" : "ready";
    if (unsafe && disposition === "blocked") registry.reasons.push("existing_plan_requires_reconciliation");
    return {planId:p.id,obligationId:p.source.obligationId,manifestHash:hash,planDigest:canonicalPlanDigest(p),disposition,checks:{registry,stripe,minimax,bank}};
  })};
}

export type PreflightReaders = {registry: (plans: TuitionPlan[])=>Promise<RegistrySnapshot>; stripe:(plans:TuitionPlan[])=>Promise<ProviderSnapshot[]>; minimax:(plans:TuitionPlan[])=>Promise<ProviderSnapshot[]>};
// Dependencies deliberately expose reads only. Exceptions never become an empty clear.
export async function collectBatchPreflight(input: BatchPreflightInput, readers: PreflightReaders, checkedAt = new Date().toISOString()) {
  const [registry,stripe,minimax] = await Promise.allSettled([readers.registry(input.plans),readers.stripe(input.plans),readers.minimax(input.plans)]);
  const incomplete = (scope:string): ProviderSnapshot => ({complete:false,records:[],scope});
  return aggregatePreflight(input,input.plans.map((_,i)=>({
    registry:registry.status === "fulfilled" ? registry.value : null,
    stripe:stripe.status === "fulfilled" ? stripe.value[i] ?? incomplete("stripe:missing_result") : incomplete("stripe:read_failed"),
    minimax:minimax.status === "fulfilled" ? minimax.value[i] ?? incomplete("minimax:missing_result") : incomplete("minimax:read_failed"),
  })),checkedAt);
}
