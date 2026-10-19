// Explicit native Stripe TEST-mode acceptance. Never sends an email or uses live credentials.
// Loads the existing local test key; storage is an isolated in-memory adapter.
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
createRequire(require.resolve('next/package.json'))('@next/env').loadEnvConfig(process.cwd(),true);
assert.match(process.env.TRAINING_STRIPE_SECRET_KEY??'',/^(sk|rk)_test_/);
Object.assign(process.env,{TUITION_ENABLED:'true',TUITION_LIVE_ENABLED:'false',TUITION_BANK_ENABLED:'true',PORTAL_SUPABASE_URL:'https://db.invalid',PORTAL_SUPABASE_SERVICE_KEY:'test-memory-only'});
const mod=p=>import(pathToFileURL(resolve(p)).href);
const {trainingStripe:s}=await mod('lib/stripe/training-client.ts');
const {assertTuitionStripe,ensureSecondSchedule,ensureTuitionCustomer}=await mod('lib/tuition/stripe.ts');
const {prepareCombinedInvitation}=await mod('lib/tuition/combined-invitation.ts');
const {stopBankCardCollection}=await mod('lib/tuition/bank.ts');
const {firstInvoiceIntent}=await mod('lib/tuition/invitation.ts');
const {planSchema,fingerprint}=await mod('lib/tuition/plan.ts');
await assertTuitionStripe('test');
const nativeFetch=globalThis.fetch;
let active;
globalThis.fetch=async(input,init={})=>{
 const u=new URL(String(input));
 if(u.origin!=='https://db.invalid') throw Error('Unexpected fetch; no email/accounting API permitted');
 if(init.method!=='PATCH'||u.pathname!=='/rest/v1/tuition_plans') throw Error('Unexpected storage operation');
 assert.equal(u.searchParams.get('id'),`eq.${active.id}`);
 Object.assign(active,JSON.parse(init.body));return Response.json([active]);
};
const product=await s.products.create({name:'Synthetic bank reconciliation acceptance',metadata:{purpose:'codex-test-bank-2026-10-19'}});
process.env.TUITION_ITEMS_JSON=JSON.stringify({'TEST-POOL':{stripeProductId:product.id}});
const customers=[],results=[];
try{
 for(const paid of [false,true]){
  const manifest=planSchema.parse(JSON.parse(await readFile('scripts/tuition-plan.example.json','utf8')));
  manifest.id=randomUUID();manifest.payerId=randomUUID();manifest.source.obligationId=`SYNTHETIC-BANK-${manifest.id}`;
  active={id:manifest.id,manifest,fingerprint:fingerprint(manifest),first_payment_flow:'stripe_invoice',invitation_state:'not_sent',created_at:new Date().toISOString(),lease_token:randomUUID(),customer_id:null};
  await ensureTuitionCustomer(active);
  const message=await prepareCombinedInvitation(active);
  customers.push(active.customer_id);
  assert.ok(message.html.includes('585,00'));assert.ok(message.attachment.contentBase64);
  assert.equal((await s.invoices.retrieve(active.first_invoice_id)).status,'open');
  if(paid){
   const pm=await s.paymentMethods.create({type:'card',card:{token:'tok_visa'}});
   await s.paymentMethods.attach(pm.id,{customer:active.customer_id});
   const pending=await firstInvoiceIntent(active.first_invoice_id);
   const intent=await s.paymentIntents.confirm(pending.id,{payment_method:pm.id,return_url:'https://example.invalid/test'});
   assert.equal((await s.invoices.retrieve(active.first_invoice_id)).status,'paid');
   assert.equal(intent.status,'succeeded');
   active.first_payment_id=intent.id;active.consent_invoice_id=active.first_invoice_id;
   await ensureSecondSchedule(active);
   assert.ok(active.schedule_id);
  }
  active.bank_entry_key='synthetic-bank-entry';active.cancelled_at=new Date().toISOString();
  assert.equal(await stopBankCardCollection(active),paid);
  assert.equal(await stopBankCardCollection(active),paid);
  const invoice=await s.invoices.retrieve(active.first_invoice_id);
  assert.equal(invoice.status,paid?'paid':'void');
  if(active.schedule_id) assert.equal((await s.subscriptionSchedules.retrieve(active.schedule_id)).status,'canceled');
  results.push({case:paid?'paid_card_conflict':'unpaid_bank_settlement',invoice:invoice.id,status:invoice.status,schedule:active.schedule_id??null,replay:true});
 }
 await mkdir('temp/bank-tests',{recursive:true,mode:0o700});
 await writeFile('temp/bank-tests/stripe-result.json',JSON.stringify({mode:'test',emailSent:false,results},null,2),{mode:0o600});
 console.log(JSON.stringify({mode:'test',emailSent:false,results},null,2));
}finally{
 globalThis.fetch=nativeFetch;
 // Explicit cleanup is TEST only and scoped to customers created by this script.
 if(active?.customer_id&&!customers.includes(active.customer_id)) customers.push(active.customer_id);
 for(const customer of customers){
  for await(const schedule of s.subscriptionSchedules.list({customer,limit:100})) if(['active','not_started'].includes(schedule.status)) await s.subscriptionSchedules.cancel(schedule.id,{invoice_now:false,prorate:false});
  for await(const invoice of s.invoices.list({customer,limit:100})){
   if(invoice.status==='draft') await s.invoices.del(invoice.id);
   if(invoice.status==='open') await s.invoices.voidInvoice(invoice.id);
  }
  await s.customers.del(customer);
 }
 await s.products.update(product.id,{active:false});
}
