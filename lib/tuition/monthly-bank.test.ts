import test from "node:test";
import assert from "node:assert/strict";
import example from "@/scripts/tuition-plan.example.json";
import {planSchema} from "./plan";
import {monthlyBankDates,monthEnd} from "./monthly-bank";
import {combinedInvitation} from "./combined-template";
import {upnPayload} from "./upn-qr";
import {upnDetails} from "./upn-details";
import {bankMatchIssue} from "./bank-model";

const monthly = (amountCents = 6500) => planSchema.parse({...example, second:undefined,
  invitationFormat:"upn_only",first:{...example.first,amountCents:amountCents*9},
  monthlyBankPayments:{amountCents,count:9,firstMonth:"2026-10"}});

test("monthly bank schedule covers month ends, year change and February",()=>{
  assert.deepEqual(monthlyBankDates(monthly()),["2026-10-31","2026-11-30","2026-12-31","2027-01-31","2027-02-28","2027-03-31","2027-04-30","2027-05-31","2027-06-30"]);
  assert.equal(monthEnd("2028-02"),"2028-02-29");
});
test("monthly manifest rejects total mismatch, card offers and inconsistent dates",()=>{
  const p=monthly();
  for(const change of [
    {first:{...p.first,amountCents:6500}}, {second:example.second},
    {invitationFormat:undefined}, {firstPaymentDeadline:"2026-10-30T23:59:00+01:00"},
    {monthlyBankPayments:{...p.monthlyBankPayments,count:8}},
    {monthlyBankPayments:{...p.monthlyBankPayments,firstMonth:"2026-11"}},
    {monthlyBankPayments:{...p.monthlyBankPayments,firstMonth:"invalid"}},
    {monthlyBankPayments:{...p.monthlyBankPayments,firstMonth:"2026-13"}},
    {firstPaymentDeadline:"invalid"},
  ]) assert.equal(planSchema.safeParse({...p,...change}).success,false);
});
test("monthly email and banking QR retain the whole obligation and same reference",()=>{
  for(const amount of [6500,6200]) {
    const p=monthly(amount), details=upnDetails(p);
    const message=combinedInvitation(p,"https://example.invalid/never-send",true);
    assert.match(message.text,/9 mesečnih obrokih/);
    assert.match(message.text,/vsak zadnji dan v mesecu/);
    assert.match(message.text,/Pred vsakim mesečnim plačilom znesek spremenite/);
    assert.match(message.text,/isti osebni sklic/);
    assert.match(message.text,new RegExp(`${amount/100},00`));
    assert.doesNotMatch(message.text+message.html,/v enem znesku|never-send|kartic|Stripe/);
    const fields=upnPayload(p).split("\n");
    assert.equal(fields[8],String(amount*9).padStart(11,"0"));
    assert.equal(fields[13],"30.06.2027");
    assert.equal(fields[15],details.reference);
    assert.equal(details.deadline,"30. 6. 2027");
    assert.equal(bankMatchIssue({account:details.iban,bankId:"test",reference:details.reference,amountCents:amount,currency:"EUR",direction:"CRDT",status:"BOOK",reversal:false,bookedOn:"2026-10-31"},details.iban,details.amountCents),"amount_mismatch");
  }
});
