// Native TEST-mode acceptance. Storage is in memory; no mail/accounting call.
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
createRequire(require.resolve('next/package.json'))('@next/env').loadEnvConfig(process.cwd(),true);
assert.match(process.env.TRAINING_STRIPE_SECRET_KEY??'',/^(sk|rk)_test_/);
Object.assign(process.env,{TUITION_ENABLED:'true',TUITION_LIVE_ENABLED:'false',
  TUITION_BANK_ENABLED:'true',TUITION_ADMIN_KEY:'synthetic-preview-key-'.repeat(3),
  PORTAL_SUPABASE_URL:'https://db.invalid',PORTAL_SUPABASE_SERVICE_KEY:'test-memory-only'});
const {trainingStripe:s}=await import('../lib/stripe/training-client.ts');
const {ensureTuitionCustomer,assertTuitionStripe,tuitionCheckout}=await import('../lib/tuition/stripe.ts');
const {prepareCombinedInvitation}=await import('../lib/tuition/combined-invitation.ts');
const {prepareFirstInvitation,sendFirstInvitation}=await import('../lib/tuition/invitation.ts');
const {stopBankCardCollection}=await import('../lib/tuition/bank.ts');
const {planSchema,fingerprint}=await import('../lib/tuition/plan.ts');
await assertTuitionStripe('test');
const manifest=planSchema.parse({...JSON.parse(await readFile('scripts/tuition-plan.example.json','utf8')),
  id:randomUUID(),payerId:randomUUID(),invitationFormat:'upn_only',second:undefined,
  first:{amountCents:37800,serviceFrom:'2026-10-12',serviceTo:'2027-05-10'},
  // Remains runnable after the original season's invitation deadline.
  firstPaymentDeadline:new Date(Date.now()+7*86400000).toISOString()});
manifest.source.obligationId=`SYNTHETIC-UPN-${manifest.id}`;
const record={id:manifest.id,manifest,fingerprint:fingerprint(manifest),
  first_payment_flow:'stripe_invoice',invitation_state:'not_sent',created_at:new Date().toISOString(),
  lease_token:randomUUID(),customer_id:null};
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(String(input));
  assert.equal(url.origin,'https://db.invalid');
  assert.equal(url.pathname,'/rest/v1/tuition_plans');assert.equal(init.method,'PATCH');
  assert.equal(url.searchParams.get('id'),`eq.${record.id}`);
  Object.assign(record,JSON.parse(init.body));return Response.json([record]);
};
const product=await s.products.create({name:'Synthetic UPN-only acceptance',metadata:{purpose:'codex-test-upn-only'}});
process.env.TUITION_ITEMS_JSON=JSON.stringify({'TEST-POOL':{stripeProductId:product.id}});
try {
  await ensureTuitionCustomer(record);
  const preview=await prepareCombinedInvitation(record);
  const same=await prepareCombinedInvitation(record);
  assert.equal(preview.invoice,same.invoice);
  const invoice=await s.invoices.retrieve(record.first_invoice_id);
  assert.equal(invoice.status,'draft');assert.equal(invoice.auto_advance,false);
  assert.equal(invoice.hosted_invoice_url,null);
  assert.doesNotMatch(preview.text+preview.html,/Stripe|kartic|obrok|eno od dveh/i);
  assert.match(preview.text,/378,00/);assert.ok(preview.attachment.contentBase64);
  assert.equal((await s.paymentIntents.list({customer:record.customer_id})).data.length,0);
  for(const action of [prepareFirstInvitation,sendFirstInvitation,tuitionCheckout])
    await assert.rejects(()=>action(record),/UPN-only/);
  const dir='temp/upn-only-tests';await mkdir(dir,{recursive:true,mode:0o700});
  const html=preview.html.replace(/src="[^"]*\/api\/tuition\/upn-qr\/[^"]+"/,
    `src="data:image/png;base64,${preview.qrImage}"`);
  await writeFile(`${dir}/preview.html`,html,{mode:0o600});
  await writeFile(`${dir}/UPN.pdf`,Buffer.from(preview.attachment.contentBase64,'base64'),{mode:0o600});
  // Existing bank reconciliation removes the unpayable draft, including replay.
  record.bank_entry_key='synthetic-bank-entry';record.cancelled_at=new Date().toISOString();
  assert.equal(await stopBankCardCollection(record),false);
  assert.equal(await stopBankCardCollection(record),false);
  assert.equal((await s.invoices.list({customer:record.customer_id})).data.length,0);
  const result={mode:'test',emailSent:false,previewReplayed:true,draftUnpayable:true,
    cardEntryPointsBlocked:true,bankSettlementReplayed:true,bankDraftRemoved:true};
  await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2),{mode:0o600});
  console.log(JSON.stringify(result));
} finally {
  globalThis.fetch=nativeFetch;
  if(record.customer_id){
    for await(const invoice of s.invoices.list({customer:record.customer_id,limit:100}))
      if(invoice.status==='draft')await s.invoices.del(invoice.id);
    await s.customers.del(record.customer_id);
  }
  await s.products.update(product.id,{active:false});
}
