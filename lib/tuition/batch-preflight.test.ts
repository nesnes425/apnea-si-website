import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {aggregatePreflight,batchPreflightSchema,canonicalPlanDigest,collectBatchPreflight,type BatchPreflightInput,type PreflightEvidence,type PreflightReaders,type ProviderRecord,type RegistrySnapshot} from "./batch-preflight";
import {fingerprint,planSchema} from "./plan";
import type {PlanRecord} from "./store";
import {readCompleteMinimaxPages,readCompleteStripePages} from "./batch-preflight-runtime";

const p=planSchema.parse({...JSON.parse(readFileSync("scripts/tuition-plan.example.json","utf8")),mode:"live"});
const checkedAt="2026-10-21T11:00:00Z";
const input:BatchPreflightInput={plans:[p],bankCoverage:{sourceRef:"OTP statement 2026-10-21",checkedAt,coveredThrough:"2026-10-20"}};
function registry():RegistrySnapshot {return {plans:[],payments:[],deliveries:[],bankEntries:[]};}
function evidence():PreflightEvidence {return {registry:registry(),stripe:{records:[],complete:true,scope:"stripe:verified_club"},minimax:{records:[],complete:true,scope:"minimax:org:241557"}};}
function record(patch:Partial<PlanRecord>={}):PlanRecord {return {id:p.id,manifest:p,fingerprint:fingerprint(p),customer_id:"cus_own",first_invoice_id:"in_own",invitation_state:"not_sent",...patch} as PlanRecord;}
function result(e=evidence(),request=input) {return aggregatePreflight(request,[e],checkedAt).results[0];}

test("request requires full approved live manifests, max ten and unique obligations",()=>{
  assert.equal(batchPreflightSchema.safeParse(input).success,true);
  assert.equal(batchPreflightSchema.safeParse({plans:[{id:p.id}]}).success,false);
  assert.equal(batchPreflightSchema.safeParse({plans:[{...p,mode:"test"}]}).success,false);
  assert.equal(batchPreflightSchema.safeParse({plans:[p,p]}).success,false);
  const ten=Array.from({length:10},(_,i)=>({...p,id:`b41d5dd2-ff7a-45a6-935a-${String(i).padStart(12,"0")}`,source:{...p.source,obligationId:`SYNTHETIC-${i}`}}));
  assert.equal(batchPreflightSchema.safeParse({plans:ten}).success,true);
  assert.equal(batchPreflightSchema.safeParse({plans:[...ten,p]}).success,false);
});
test("complete evidence returns exact canonical and storage hashes with no payer PII",()=>{
  const r=result();
  assert.equal(r.disposition,"ready");
  assert.equal(r.manifestHash,fingerprint(p));
  assert.equal(r.planDigest,canonicalPlanDigest(p));
  assert.equal(r.planDigest,canonicalPlanDigest(Object.fromEntries(Object.entries(p).reverse()) as typeof p));
  for(const value of [p.payer.name,p.payer.email,p.payer.address,p.participant]) assert.ok(!JSON.stringify(r).includes(value));
  assert.equal(r.checks.bank.coverage?.basis,"operator_statement_coverage");
});
test("absent registry never implies clear even when providers are clear",()=>{
  const e=evidence();e.registry=null;
  assert.equal(result(e).disposition,"blocked");assert.equal(result(e).checks.registry.status,"incomplete");
});
test("no bank register entries cannot prove no unimported money",()=>{
  const r=result(evidence(),{plans:[p]});
  assert.equal(r.disposition,"blocked");assert.equal(r.checks.bank.status,"incomplete");
});
test("stale, future and uncovered bank inputs fail closed",()=>{
  for(const bankCoverage of [
    {...input.bankCoverage!,checkedAt:"2026-10-18T11:00:00Z"},
    {...input.bankCoverage!,checkedAt:"2026-10-22T11:00:00Z"},
    {...input.bankCoverage!,coveredThrough:"2026-10-18"},
    {...input.bankCoverage!,coveredThrough:"2026-10-22"},
  ]) assert.equal(result(evidence(),{plans:[p],bankCoverage}).disposition,"blocked");
});
test("exact stored manifest supports resume and own unpaid invoice",()=>{
  const e=evidence();e.registry!.plans=[record()];
  e.stripe.records=[{ref:"stripe:in_own",kind:"invoice",tuition:true,planId:p.id,customerId:"cus_own"}];
  assert.equal(result(e).disposition,"resume");assert.equal(result(e).checks.stripe.status,"match");
});
test("same plan ID with altered manifest or stored fingerprint is blocked",()=>{
  for(const patch of [{fingerprint:"wrong"},{manifest:{...p,participant:"Different participant"}}]) {
    const e=evidence();e.registry!.plans=[record(patch)];assert.equal(result(e).checks.registry.status,"conflict");
  }
});
test("duplicate obligation under another ID and same participant overlapping season are blocked",()=>{
  for(const source of [p.source,{...p.source,obligationId:"OTHER-OBLIGATION"}]) {
    const e=evidence();const other={...p,id:"67f53958-4554-4222-a0c8-86a4b16b9d52",source};
    e.registry!.plans=[record({id:other.id,manifest:other,fingerprint:fingerprint(other)})];
    assert.equal(result(e).checks.registry.status,"conflict");
  }
});
test("distinct participant obligation sharing payer is not an automatic conflict",()=>{
  const e=evidence();const other={...p,id:"67f53958-4554-4222-a0c8-86a4b16b9d52",participant:"Other participant",source:{...p.source,obligationId:"OTHER-OBLIGATION"}};
  e.registry!.plans=[record({id:other.id,manifest:other,fingerprint:fingerprint(other)})];
  e.stripe.records=[{ref:"stripe:in_other",kind:"invoice",tuition:true,planId:other.id}];
  assert.equal(result(e).disposition,"ready");
});
test("explicit membership-only invoices and payments are excluded, tuition/mixed records never are",()=>{
  for(const kind of ["invoice","payment"] as const) {
    const e=evidence();e.stripe.records=[{ref:"stripe:member",kind,membershipOnly:true}];
    e.minimax.records=[{ref:"minimax:123",kind:"invoice",membershipOnly:true}];
    assert.equal(result(e).disposition,"ready");
    e.stripe.records[0].tuition=true;assert.equal(result(e).disposition,"blocked");
  }
});
test("unknown existing invoice/payment is relevant conflict and needs actual reconciliation",()=>{
  for(const key of ["stripe","minimax"] as const) {
    const e=evidence();e[key].records=[{ref:`${key}:unknown`,kind:"invoice"}];assert.equal(result(e).checks[key].status,"conflict");
  }
});
test("unrelated dated service and void records are excluded; missing service dates stay relevant",()=>{
  const e=evidence();e.minimax.records=[{ref:"minimax:old",kind:"invoice",tuition:true,serviceFrom:"2025-10-01",serviceTo:"2026-06-30"}];
  e.stripe.records=[{ref:"stripe:void",kind:"invoice",tuition:true,inactive:true}];
  assert.equal(result(e).disposition,"ready");delete e.minimax.records[0].serviceTo;assert.equal(result(e).disposition,"blocked");
});
test("extra own-plan invoice or provider-paid invoice without registered payment blocks resume",()=>{
  for(const invoice of [
    {ref:"stripe:in_duplicate",kind:"invoice",tuition:true,planId:p.id,customerId:"cus_own"},
    {ref:"stripe:in_own",kind:"invoice",tuition:true,planId:p.id,customerId:"cus_own",paid:true},
  ] satisfies ProviderRecord[]) {
    const e=evidence();e.registry!.plans=[record()];e.stripe.records=[invoice];assert.equal(result(e).disposition,"blocked");
  }
});
test("durably paid and submitted exact plans are safe skips even with unavailable provider coverage",()=>{
  for(const patch of [{first_payment_id:"pi_paid"},{bank_state:"paid" as const},{invitation_state:"submitted" as const}]) {
    const e=evidence();e.registry!.plans=[record(patch)];e.stripe.complete=false;e.minimax.complete=false;
    assert.equal(result(e,{plans:[p]}).disposition,"invitation_state" in patch ? "skip_submitted":"skip_paid");
  }
});
test("submitted durable delivery lock skips and uncertain lock blocks",()=>{
  const e=evidence();e.registry!.plans=[record()];e.registry!.deliveries=[{id:"delivery-id",plan_id:p.id,submission_state:"submitted"}];
  assert.equal(result(e).disposition,"skip_submitted");
  e.registry!.deliveries[0].submission_state="uncertain";assert.equal(result(e).disposition,"blocked");
});
test("pending/review bank evidence blocks and paid bank record skips",()=>{
  for(const state of ["pending","review","paid"]) {
    const e=evidence();e.registry!.plans=[record({bank_state:state==="pending" ? "pending":state as "review"|"paid"})];
    e.registry!.bankEntries=[{entry_key:"bank-key",plan_id:p.id,state}];
    assert.equal(result(e).disposition,state==="paid" ? "skip_paid":"blocked");
  }
});
test("provider failure and partial coverage never become absence; dependencies expose no writes",async()=>{
  const reads:string[]=[];
  const readers:PreflightReaders={registry:async()=>{reads.push("registry");return registry();},stripe:async()=>{reads.push("stripe");throw new Error("Provider raw secret or PII must not escape");},minimax:async()=>{reads.push("minimax");return [{records:[],complete:false,scope:"minimax:partial"}];}};
  const r=await collectBatchPreflight(input,readers,checkedAt);
  assert.deepEqual(reads.sort(),["minimax","registry","stripe"]);
  assert.equal(r.results[0].disposition,"blocked");assert.equal(r.results[0].checks.stripe.status,"incomplete");assert.equal(r.results[0].checks.minimax.status,"incomplete");
  assert.ok(!JSON.stringify(r).includes("raw secret"));
});
test("Stripe pagination follows cursor through final page and rejects repeated or missing next page",async()=>{
  const cursors:(string|undefined)[]=[];
  const r=await readCompleteStripePages(async cursor=>{cursors.push(cursor);return cursor ? {data:[{id:"2"}],has_more:false}:{data:[{id:"1"}],has_more:true};},()=>{});
  assert.equal(r.length,2);assert.deepEqual(cursors,[undefined,"1"]);
  await assert.rejects(()=>readCompleteStripePages(async()=>({data:[{id:"1"}],has_more:true}),()=>{}));
  await assert.rejects(()=>readCompleteStripePages(async()=>({data:[],has_more:true}),()=>{}));
});
test("Minimax pagination requires explicit stable complete totals and unique IDs",async()=>{
  const rows=Array.from({length:100},(_,i)=>({CustomerId:i+1}));
  const r=await readCompleteMinimaxPages(async page=>({Rows:page===1 ? rows:[{CustomerId:101}],TotalRows:101,CurrentPageNumber:page,PageSize:100}),()=>{});
  assert.equal(r.length,101);
  for(const response of [
    {Rows:[],TotalRows:1,CurrentPageNumber:1,PageSize:100},
    {Rows:[{CustomerId:1}],TotalRows:2,CurrentPageNumber:1,PageSize:100},
    {Rows:[{CustomerId:1}],CurrentPageNumber:1,PageSize:100},
  ]) await assert.rejects(()=>readCompleteMinimaxPages(async()=>response as never,()=>{}));
});
