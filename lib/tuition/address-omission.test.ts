import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planSchema,fingerprint,invoiceConsentHash} from './plan';
import {upnPayload,iso88592} from './upn-qr';
import {upnPayerText,tuitionUpnPdf} from './upn-pdf';
import {tuitionCustomerParams} from './stripe';
import {combinedInvitation} from './combined-template';
import {tuitionBillingDetails,tuitionCustomerCode,assertTuitionCustomerMatches,tuitionInvoicePayload,assertTuitionInvoiceMatches} from '../minimax/tuition-invoice';
import type {PaymentRecord} from './store';
const raw=()=>JSON.parse(readFileSync('scripts/tuition-plan.example.json','utf8'));
function omitted(){const p=raw();return planSchema.parse({...p,payer:{...p.payer,address:'',postalCode:'',city:'',accountingMode:'generic_consumer_address_omitted'}});}
test('address omission is explicit, SI only, wholly blank, and bound to immutable consent',()=>{
 const legacy=raw();assert.deepEqual(planSchema.parse(legacy),legacy);assert.equal(fingerprint(legacy),fingerprint(planSchema.parse(legacy)));
 const p=omitted();assert.notEqual(fingerprint(p),fingerprint(legacy));assert.notEqual(invoiceConsentHash(p),invoiceConsentHash(legacy));
 const payer={...p.payer};delete payer.accountingMode;assert.throws(()=>planSchema.parse({...p,payer}));
 for(const changed of [{country:'IT'},{address:'/'},{postalCode:'1000'},{city:'Ljubljana'},{accountingMode:'unknown'}])assert.throws(()=>planSchema.parse({...p,payer:{...p.payer,...changed}}));
});
test('UPN omits exactly the two payer address lines while retaining checksum and recipient identity',async t=>{
 const priorKey=process.env.TUITION_ADMIN_KEY;process.env.TUITION_ADMIN_KEY='synthetic-address-omission-key-123456789';t.after(()=>{if(priorKey===undefined)delete process.env.TUITION_ADMIN_KEY;else process.env.TUITION_ADMIN_KEY=priorKey;});
 const p=omitted(),payload=upnPayload(p),f=payload.split('\n');
 assert.equal(f[5],p.payer.name);assert.deepEqual(f.slice(6,8),['','']);assert.equal(f[8],'00000058500');assert.equal(f.length,21);
 assert.equal(Number(f[19]),iso88592(f.slice(0,19).join('\n')+'\n').length);
 assert.equal(upnPayerText(p.payer),p.payer.name);assert.equal(upnPayerText(raw().payer),'Preizkusni plačnik\nPreizkusna ulica 1\n1000 Ljubljana');
 const pdf=await tuitionUpnPdf(p);assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.ok(pdf.length>2000);
 const bad={...p,payer:{...p.payer,accountingMode:undefined}};assert.throws(()=>upnPayload(bad));
 assert.throws(()=>upnPayload({...p,payer:{...p.payer,name:''}}));
 const message=combinedInvitation(p,'https://example.invalid/pay');assert.ok(message.subject.includes(p.participant));assert.ok(!message.text.includes('Fizična oseba/Kupec'));
 const stripe=tuitionCustomerParams(p);assert.equal(stripe.name,p.payer.name);assert.equal(stripe.email,p.payer.email);assert.equal(stripe.address,undefined);
 assert.deepEqual(tuitionCustomerParams(planSchema.parse(raw())).address,{line1:'Preizkusna ulica 1',postal_code:'1000',city:'Ljubljana',country:'SI'});
});
test('only Minimax adapter receives generic markers; code remains unique per payer and readback is strict',t=>{
 const settings={TUITION_ITEMS_JSON:JSON.stringify({'TEST-POOL':{stripeProductId:'prod_synthetic',minimaxItemId:2}}),MINIMAX_TUITION_VAT_PERCENT:'0',MINIMAX_TUITION_VAT_CLAUSE:'synthetic exemption',MINIMAX_TUITION_VAT_RATE_ID:'3',MINIMAX_TRAINING_ORGANISATION_ID:'241557',MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID:'4',MINIMAX_TRAINING_CURRENCY_ID:'5',MINIMAX_TRAINING_REPORT_TEMPLATE_ID:'6',MINIMAX_TRAINING_PAYMENT_METHOD_ID:'7',MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID:'192'};
 const previous=Object.fromEntries(Object.keys(settings).map(k=>[k,process.env[k]]));Object.assign(process.env,settings);t.after(()=>{for(const[k,v]of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;});
 const p=omitted(),billing=tuitionBillingDetails(p);assert.deepEqual(billing,{Name:'Fizična oseba/Kupec',Address:'/',PostalCode:'/',City:'/'});
 const code=tuitionCustomerCode(p);assert.notEqual(code,tuitionCustomerCode({...p,payerId:'efaa6009-9f19-4db5-80ab-6e57d42c8c11'}));
 const customer={...billing,CustomerId:12,Code:code,Country:{ID:192}};assertTuitionCustomerMatches(p,customer);
 for(const change of [{Code:'shared'},{Name:p.payer.name},{Address:''},{PostalCode:'1000'},{City:'Ljubljana'},{Country:{ID:106}}])assert.throws(()=>assertTuitionCustomerMatches(p,{...customer,...change}),/differs/);
 const payment={id:'pi_synthetic_generic',instalment:1,amount_cents:p.first.amountCents,paid_at:'2026-10-22T10:00:00Z'} as PaymentRecord;
 const payload=tuitionInvoicePayload(p,payment,12);assert.equal(payload.AddresseeName,billing.Name);assert.equal(payload.AddresseeAddress,'/');assert.equal(payload.AddresseePostalCode,'/');assert.equal(payload.AddresseeCity,'/');assert.ok(payload.IssuedInvoiceRows[0].Description.includes(p.participant));
 const invoice={...payload,IssuedInvoiceId:10,Status:'O',InvoiceValue:0,IssuedInvoiceRows:payload.IssuedInvoiceRows.map(r=>({...r,Value:p.first.amountCents/100}))};assertTuitionInvoiceMatches(invoice,payload,p.first.amountCents);
 for(const change of [{AddresseeName:p.payer.name},{AddresseeAddress:''},{AddresseePostalCode:'1000'},{AddresseeCity:'Ljubljana'}])assert.throws(()=>assertTuitionInvoiceMatches({...invoice,...change},payload,p.first.amountCents),/differs/);
 assert.deepEqual(tuitionBillingDetails(planSchema.parse(raw())),{Name:raw().payer.name,Address:raw().payer.address,PostalCode:raw().payer.postalCode,City:raw().payer.city});
});
