import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {minimaxIndividualSwimmingItem} from "@/lib/config";
import type {MinimaxIssuedInvoice} from "@/lib/minimax/client";
import {aggregatePreflight,type PreflightEvidence,type ProviderRecord} from "./batch-preflight";
import {planSchema} from "./plan";
import {classifyMinimaxInvoice} from "./minimax-preflight-classification";

const plan=planSchema.parse({...JSON.parse(readFileSync("scripts/tuition-plan.example.json","utf8")),mode:"live"});
const now="2026-11-25T13:00:00Z", seasonalId=999001, membershipId=999002;
function invoice():MinimaxIssuedInvoice {
  return {IssuedInvoiceId:123,AddresseeName:plan.payer.name,DateTransactionFrom:"2026-11-11",DateTransaction:"2026-11-11",
    InvoiceForPeriod:"N",DocumentReference:"",Notes:"individual-swimming-2026-11-11; Osnutek po navodilu lastnika.",
    IssuedInvoiceRows:[{Item:{ID:minimaxIndividualSwimmingItem.itemId,Name:minimaxIndividualSwimmingItem.name},
      ItemName:minimaxIndividualSwimmingItem.name,Description:"Individualna ura učenja plavanja; bazen Tivoli.",Quantity:1,Price:40,Value:40}],
  };
}
function classification(i:MinimaxIssuedInvoice) {return classifyMinimaxInvoice(i,new Set([seasonalId]),membershipId,241557);}
function record(i:MinimaxIssuedInvoice):ProviderRecord {return {ref:`minimax:${i.IssuedInvoiceId}`,kind:"invoice",...classification(i),serviceFrom:i.DateTransactionFrom,serviceTo:i.DateTransaction};}
function result(r:ProviderRecord,linked=false) {
  const e:PreflightEvidence={registry:{plans:[],payments:linked?[{id:"payment-test",plan_id:plan.id,minimax_id:123}]:[],bankEntries:[],deliveries:[]},
    stripe:{complete:true,scope:"stripe:fixture",records:[]},minimax:{complete:true,scope:"minimax:fixture",records:[r]}};
  return aggregatePreflight({plans:[plan],bankCoverage:{sourceRef:"Synthetic bank export",checkedAt:now,coveredThrough:"2026-11-25"}},[e],now).results[0];
}
test("verified individual swimming invoice for same payer and overlapping date is separate",()=>{
  const i=invoice(),c=classification(i),r=result(record(i));
  assert.equal(c.separateService,"individual_swimming");assert.equal(c.tuition,false);assert.equal(c.membershipOnly,false);
  assert.equal(r.disposition,"ready");assert.deepEqual(r.checks.minimax.references,["minimax:fixture","minimax:123:separate_individual_swimming"]);
});
test("mixed individual and seasonal, membership or unknown rows are not excluded",()=>{
  for(const extra of [
    {Item:{ID:seasonalId},ItemName:"Vadnina – Ljubljana – Tivoli",Description:"Sezona 2026/27"},
    {Item:{ID:membershipId},ItemName:"Članarina",Description:"Letna članarina"},
    {Item:{ID:888},ItemName:"Druga storitev",Description:"Neznana postavka"},
  ]) {
    const i=invoice();i.IssuedInvoiceRows!.push(extra);
    assert.equal(classification(i).separateService,undefined);assert.equal(result(record(i)).disposition,"blocked");
  }
});
test("unknown item with identical title or known item with missing/changed evidence stays blocked",()=>{
  for(const change of [
    (i:MinimaxIssuedInvoice)=>{i.IssuedInvoiceRows![0].Item!.ID=888;},
    (i:MinimaxIssuedInvoice)=>{i.IssuedInvoiceRows![0].ItemName="Vadnina – Tivoli";},
    (i:MinimaxIssuedInvoice)=>{delete i.IssuedInvoiceRows![0].ItemName;},
    (i:MinimaxIssuedInvoice)=>{i.IssuedInvoiceRows![0].Item!.Name="Sezonska vadnina";},
    (i:MinimaxIssuedInvoice)=>{i.IssuedInvoiceRows![0].Description="";},
    (i:MinimaxIssuedInvoice)=>{i.IssuedInvoiceRows![0].Description="Individualna vadnina za sezono 2026/27";},
  ]) {
    const i=invoice();change(i);assert.equal(classification(i).separateService,undefined);assert.equal(result(record(i)).disposition,"blocked");
  }
});
test("seasonal metadata, period or payment/document reference prevents individual-service exclusion",()=>{
  for(const patch of [
    {Notes:`Vadnina; plan ${plan.id}`},
    {Notes:"2026/27"},
    {Notes:"2026–2027"},
    {DescriptionAbove:"Vadnina za sezono 2026/27"},
    {DescriptionBelow:"Plačan 1. obrok."},
    {DocumentReference:"pi_seasonal_payment"},
    {DocumentReference:"unknown_reference"},
    {Notes:plan.id},
    {InvoiceForPeriod:"D"},
  ]) {
    const i={...invoice(),...patch};assert.equal(classification(i).separateService,undefined);assert.equal(result(record(i)).disposition,"blocked");
  }
});
test("catalogue mapping is organisation scoped and never overrides seasonal item mapping",()=>{
  assert.equal(classifyMinimaxInvoice(invoice(),new Set([seasonalId]),membershipId,999).separateService,undefined);
  assert.equal(classifyMinimaxInvoice(invoice(),new Set([minimaxIndividualSwimmingItem.itemId]),membershipId,241557).separateService,undefined);
  assert.throws(()=>classification({...invoice(),IssuedInvoiceRows:[]}));
});
test("pure seasonal and wholly unknown invoices remain blocking",()=>{
  for(const row of [{Item:{ID:seasonalId},ItemName:"Vadnina",Description:"Sezona 2026/27"},{Item:{ID:888},ItemName:"Neznano",Description:"Druga storitev"}]) {
    const i={...invoice(),IssuedInvoiceRows:[row]};assert.equal(classification(i).separateService,undefined);assert.equal(result(record(i)).disposition,"blocked");
  }
});
test("aggregator rejects separate-service flags on tuition, plan-linked, registry-linked or non-Minimax records",()=>{
  const r=record(invoice());
  for(const patch of [{tuition:true},{planId:plan.id},{ref:"stripe:123"},{kind:"payment" as const}]) assert.equal(result({...r,...patch}).disposition,"blocked");
  assert.equal(result(r,true).disposition,"blocked");
});
