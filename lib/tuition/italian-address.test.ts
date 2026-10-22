import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planSchema,fingerprint} from './plan';
import {tuitionCountryId,tuitionInvoicePayload,assertTuitionCustomerMatches,assertTuitionInvoiceMatches} from '../minimax/tuition-invoice';
import type {PaymentRecord} from './store';

test('Italian personal payer retains country and five-digit postal code; existing SI fingerprint unchanged',()=>{
 const raw=JSON.parse(readFileSync('scripts/tuition-plan.example.json','utf8'));
 const si=planSchema.parse(raw);assert.equal(fingerprint(si),fingerprint(raw));assert.deepEqual(si,raw);
 const it=planSchema.parse({...raw,payer:{...raw.payer,country:'IT',postalCode:'33048',city:'San Giovanni al Natisone',address:'Via delle Scuole 20'}});
 assert.equal(it.payer.country,'IT');assert.equal(tuitionCountryId('IT'),106);
 assert.throws(()=>planSchema.parse({...it,payer:{...it.payer,postalCode:'3304'}}));
 assert.throws(()=>planSchema.parse({...it,payer:{...it.payer,country:'DE'}}));
 const customer={CustomerId:12,Name:it.payer.name,Address:it.payer.address,PostalCode:it.payer.postalCode,City:it.payer.city,Country:{ID:106}};
 assertTuitionCustomerMatches(it,customer);
 for(const change of [{Country:{ID:192}},{Address:'Different 1'},{PostalCode:'1000'},{City:'Ljubljana'}])assert.throws(()=>assertTuitionCustomerMatches(it,{...customer,...change}),/address differs/);
});

test('Italian Minimax invoice uses Italy and rejects returned Slovenia or altered address',t=>{
 const settings={TUITION_ITEMS_JSON:JSON.stringify({'TEST-POOL':{stripeProductId:'prod_synthetic',minimaxItemId:2}}),MINIMAX_TUITION_VAT_PERCENT:'0',MINIMAX_TUITION_VAT_CLAUSE:'synthetic exemption',MINIMAX_TUITION_VAT_RATE_ID:'3',MINIMAX_TRAINING_ORGANISATION_ID:'241557',MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID:'4',MINIMAX_TRAINING_CURRENCY_ID:'5',MINIMAX_TRAINING_REPORT_TEMPLATE_ID:'6',MINIMAX_TRAINING_PAYMENT_METHOD_ID:'7',MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID:'192'};
 const previous=Object.fromEntries(Object.keys(settings).map(k=>[k,process.env[k]]));Object.assign(process.env,settings);t.after(()=>{for(const[k,v]of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;});
 const raw=JSON.parse(readFileSync('scripts/tuition-plan.example.json','utf8'));const p=planSchema.parse({...raw,payer:{...raw.payer,country:'IT',postalCode:'33048',city:'San Giovanni al Natisone'}});
 const payment={id:'pi_synthetic_it',instalment:1,amount_cents:p.first.amountCents,paid_at:'2026-10-22T10:00:00Z'} as PaymentRecord;
 const payload=tuitionInvoicePayload(p,payment,12);assert.equal(payload.AddresseeCountry.ID,106);assert.equal(payload.AddresseePostalCode,'33048');
 const invoice={...payload,IssuedInvoiceId:10,Status:'O',InvoiceValue:0,IssuedInvoiceRows:payload.IssuedInvoiceRows.map(r=>({...r,Value:p.first.amountCents/100}))};
 assertTuitionInvoiceMatches(invoice,payload,p.first.amountCents);
 for(const change of [{AddresseeCountry:{ID:192}},{AddresseeAddress:'Different 1'}])assert.throws(()=>assertTuitionInvoiceMatches({...invoice,...change},payload,p.first.amountCents),/differs from approved/);
});
