import test from "node:test";
import assert from "node:assert/strict";
import example from "@/scripts/tuition-plan.example.json";
import {planSchema, fingerprint, invoicePaymentNotice} from "./plan";
import {combinedInvitation} from "./combined-template";
import {upnDetails} from "./upn-details";
import {tuitionQr} from "./upn-qr";

test("optional explanation preserves old manifests and cannot change financial payment data", () => {
  const original = planSchema.parse(example);
  assert.deepEqual(original, example);
  // Verified with the published legacy schema before this optional field was added.
  assert.equal(fingerprint(original), "a217ed615ab06b632243419b8163153bfa970d83b3c1d8983e8081c01cdd2347");
  assert.ok(!Object.hasOwn(original, "paymentAdjustmentNote"));
  const note = "Celoletna vadnina 585 € je zaradi poznejšega začetka zmanjšana za 65 €; skupaj 520 €.";
  const annotated = planSchema.parse({...original, paymentAdjustmentNote: note});
  assert.notEqual(fingerprint(annotated), fingerprint(original));
  assert.deepEqual(upnDetails(annotated, true), upnDetails(original, true));
  assert.deepEqual(tuitionQr(annotated, true), tuitionQr(original, true));
  assert.equal(invoicePaymentNotice(annotated), invoicePaymentNotice(original));
  const oldMessage = combinedInvitation(original, "[testna povezava]", true);
  const newMessage = combinedInvitation(annotated, "[testna povezava]", true);
  assert.equal(newMessage.text.replace(note + "\n\n", ""), oldMessage.text);
  assert.equal(newMessage.html.replace(`<p style="margin:0 0 19px">${note}</p>`, ""), oldMessage.html);
});

test("customer explanation is escaped and placed after total before payment choices", () => {
  const note = 'Zmanjšanje 32,50 € <img src=x onerror="alert(1)"> & preostanek.';
  const plan = planSchema.parse({...example, paymentAdjustmentNote: note});
  const message = combinedInvitation(plan, "[testna povezava]", true);
  assert.ok(message.text.indexOf(note) > message.text.indexOf("v skupnem znesku"));
  assert.ok(message.text.indexOf(note) < message.text.indexOf("Izberete lahko"));
  assert.match(message.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; preostanek/);
  assert.doesNotMatch(message.html, /<img src=x/);
  assert.equal(message.text.split(note).length, 2);
  for (const invalid of ["", "   ", "a".repeat(601), 3])
    assert.equal(planSchema.safeParse({...example, paymentAdjustmentNote: invalid}).success, false);
});
