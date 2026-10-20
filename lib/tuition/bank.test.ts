import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {bankReference, bankMatchIssue, entryKey, entryFingerprint, mod97, type BankEntry} from "./bank-model";
import {combinedInvitation} from "./combined-template";
import {planSchema, CLUB_STRIPE_ACCOUNT} from "./plan";
import {stopBankCardCollection, importBankStatement} from "./bank";
import {trainingStripe} from "@/lib/stripe/training-client";
import type {PlanRecord} from "./store";
const p=planSchema.parse(JSON.parse(readFileSync('scripts/tuition-plan.example.json','utf8')));
const e: BankEntry={account:'SI56040000277781751', bankId:'bank-1', reference:bankReference(p.id),amountCents:58500,currency:'EUR',direction:'CRDT',status:'BOOK',reversal:false,bookedOn:'2026-10-19'};
test('reference checksum and transaction identity survive overlapping exports; changed evidence conflicts',()=>{
 assert.equal(mod97(e.reference.slice(4)+e.reference.slice(0,4)),1);
 assert.equal(entryKey(e),entryKey({...e,amountCents:1}));
 assert.notEqual(entryFingerprint(e),entryFingerprint({...e,amountCents:1}));
 assert.throws(()=>entryKey({...e,bankId:'NOTPROVIDED'}));
 assert.notEqual(e.reference,bankReference('other-plan'));
});
test('only exact booked EUR full-season credits auto-match',()=>{
 assert.equal(bankMatchIssue(e,e.account,58500),null);
 for(const change of [{amountCents:32500},{currency:'USD'},{direction:'DBIT' as const},{reversal:true},{status:'PDNG'},{account:'DE89370400440532013000'},{issue:'grouped'},{bankId:''}])
  assert.ok(bankMatchIssue({...e,...change},e.account,58500));
});
test('combined sample includes immediate first charge, full UPN, agreement and no payable bank details',()=>{
 const m=combinedInvitation({...p,participant:'<script>alert(1)</script>'},'[Stripe povezava]',true);
 assert.equal(m.subject,'Vadnina 2026/27 – Vzorec Član');
 assert.match(m.text,/585,00/);assert.match(m.text,/325,00/);assert.match(m.text,/260,00/);assert.match(m.text,/takoj/);assert.match(m.text,/Dogovorom/);
 assert.ok(!m.html.includes('<script>'));assert.ok(!m.text.includes(e.account));
});
test('disabled feature permits read-only OTP validation but rejects apply before any write',async()=>{
 process.env.TUITION_BANK_ENABLED='false';process.env.PORTAL_SUPABASE_URL='https://db.invalid';process.env.PORTAL_SUPABASE_SERVICE_KEY='synthetic-only';
 const original=globalThis.fetch;let reads=0;
 globalThis.fetch=async(_input,init)=>{assert.equal(init?.method,'GET');reads++;return Response.json([]);};
 const input={fileHash:'a'.repeat(64),format:'camt.053.001.08' as const,entries:[e]};
 try{
  assert.equal((await importBankStatement(input,false)).results[0].state,'review');
  await assert.rejects(()=>importBankStatement(input,true),/not enabled/);assert.equal(reads,1);
 }finally{globalThis.fetch=original;}
});
test('bank closure stops schedule first, voids open invoices and re-reads payments without refunds',async()=>{
 process.env.TRAINING_STRIPE_SECRET_KEY='sk_test_synthetic'; process.env.TUITION_ENABLED='true';
 const calls:string[]=[];
 const originals={account:trainingStripe.accounts.retrieve,schedules:trainingStripe.subscriptionSchedules.list,cancel:trainingStripe.subscriptionSchedules.cancel,invoices:trainingStripe.invoices.list,void:trainingStripe.invoices.voidInvoice,intents:trainingStripe.paymentIntents.list};
 const asyncList=(items:unknown[])=>({async *[Symbol.asyncIterator](){yield* items;}});
 const r={id:p.id,manifest:p,customer_id:'cus_synthetic',first_payment_flow:'stripe_invoice',bank_entry_key:'key',cancelled_at:'2026-10-19'} as PlanRecord;
 let succeeded=false;
 Object.assign(trainingStripe.accounts,{retrieve:async()=>({id:CLUB_STRIPE_ACCOUNT})});
 Object.assign(trainingStripe.subscriptionSchedules,{list:()=>asyncList([{id:'sched',status:'not_started',metadata:{planId:p.id},livemode:false}]),cancel:async(_id: string,params:unknown)=>{calls.push('cancel');assert.deepEqual(params,{invoice_now:false,prorate:false});return{status:'canceled'};}});
 Object.assign(trainingStripe.invoices,{list:()=>asyncList([{id:'in_first',metadata:{planId:p.id},livemode:false,status:'open',amount_paid:0}]),voidInvoice:async()=>{calls.push('void');return{status:'void'};}});
 Object.assign(trainingStripe.paymentIntents,{list:()=>{calls.push('inspect');return asyncList([{status:succeeded?'succeeded':'canceled',livemode:false}]);}});
 try{
  assert.equal(await stopBankCardCollection(r),false);assert.deepEqual(calls,['cancel','void','inspect']);
  succeeded=true;assert.equal(await stopBankCardCollection(r),true);
  Object.assign(trainingStripe.invoices,{voidInvoice:async()=>{throw Error('payment race');}});
  await assert.rejects(()=>stopBankCardCollection(r),/payment race/);
 }finally{
  trainingStripe.accounts.retrieve=originals.account;trainingStripe.subscriptionSchedules.list=originals.schedules;trainingStripe.subscriptionSchedules.cancel=originals.cancel;trainingStripe.invoices.list=originals.invoices;trainingStripe.invoices.voidInvoice=originals.void;trainingStripe.paymentIntents.list=originals.intents;
 }
});

test('one-payment invitation preserves short service period and never promises a second charge',()=>{
 const oldKey=process.env.TUITION_ADMIN_KEY;process.env.TUITION_ADMIN_KEY='synthetic-test-only-key-'.repeat(2);
 const single={...p,first:{amountCents:12400,serviceFrom:'2026-10-05',serviceTo:'2026-11-30'},second:undefined};
 let message;
 try {message=combinedInvitation(single,'https://example.invalid/payment');}
 finally {if(oldKey===undefined)delete process.env.TUITION_ADMIN_KEY;else process.env.TUITION_ADMIN_KEY=oldKey;}
 assert.match(message.text,/124,00/);assert.match(message.text,/Enkratno plačilo/);
 assert.ok(message.text.includes('30. 11. 2026'));
 assert.doesNotMatch(message.text,/Drugi obrok|dveh obrokih|celotno sezono/);
});

test('UPN-only has full amount, original period, QR and no card link or instalment promise',()=>{
 const single=planSchema.parse({...p,invitationFormat:'upn_only',second:undefined,
   first:{amountCents:37800,serviceFrom:'2026-10-12',serviceTo:'2027-05-10'}});
 const message=combinedInvitation(single,'https://example.invalid/must-not-appear',true);
 assert.match(message.text,/378,00/);
 assert.match(message.text,/12\. 10\. 2026 – 10\. 5\. 2027/);
 assert.match(message.html,/<img /);
 assert.doesNotMatch(message.html+message.text,/must-not-appear|Stripe|kartic|obrok|eno od dveh/i);
 assert.equal(planSchema.safeParse({...single,second:p.second}).success,false);
});
