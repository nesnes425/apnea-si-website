import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { siteConfig } from "../config";
import { planSchema, fingerprint, invoicePaymentNotice, invoiceConsentHash, consentText } from "./plan";

const example = JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8"));

test("unsigned plans require the explicit versioned agreement notice", () => {
  const unsigned = { ...example, approval: { ...example.approval, agreementSigned: false } };
  assert.equal(planSchema.safeParse({ ...unsigned, agreementNoticeVersion: undefined }).success, false);
  assert.equal(planSchema.safeParse({ ...unsigned, agreementNoticeVersion: "unknown" }).success, false);
  const plan = planSchema.parse(unsigned);
  assert.equal(plan.approval.agreementSigned, false);
  assert.match(invoicePaymentNotice(plan), /S prijavo na treninge in plačilom vadnine soglašate/);
  assert.ok(invoicePaymentNotice(plan).includes(siteConfig.tuitionAgreement2026.url));
  assert.ok(consentText(plan).includes(siteConfig.tuitionAgreement2026.url));
  assert.notEqual(invoiceConsentHash(plan), invoiceConsentHash({ ...plan, agreementNoticeVersion: undefined }));
});

test("legacy fingerprints and consent stay identical for existing Stripe objects", () => {
  const { agreementNoticeVersion: _version, ...legacy } = example;
  void _version;
  const plan = planSchema.parse(legacy);
  assert.equal(fingerprint(plan), "41088f7356f25ffcdc6a6bfbff1b11f1b62d8235e73fc2a7d68951aa3d37760e");
  assert.equal(invoiceConsentHash(plan), "5f5225f9f3718f96a1a547fa936344dbd4fcae8a0f7231c0a7a55f1eb8caf594");
  assert.equal(invoicePaymentNotice(plan).includes("Dogovor"), false);
});

test("agreement notice preserves finite card consent and fits the existing limit", () => {
  const plan = planSchema.parse(example);
  for (const first of [32500, 1_000_000]) {
    const notice = invoicePaymentNotice({
      ...plan,
      first: { ...plan.first, amountCents: first },
      second: { ...plan.second!, amountCents: 1_000_000 },
    });
    assert.ok(notice.length <= 500);
    assert.match(notice, /shranitvijo kartice/);
    assert.match(notice, /enim samodejnim plačilom/);
    assert.match(notice, /11\. 12\. 2026/);
    assert.match(notice, /30\. 11\. 2026/);
    assert.match(notice, /Po drugem obroku se plačila končajo/);
  }
  const single = invoicePaymentNotice({ ...plan, second: undefined });
  assert.match(single, /Dogovor/);
  assert.doesNotMatch(single, /shranitvijo kartice|samodejnim plačilom/);
});

test("the 2026/27 notice cannot silently be reused for a later service season", () => {
  assert.equal(planSchema.safeParse({
    ...example, first: { ...example.first, serviceTo: "2027-10-01" },
  }).success, false);
});
