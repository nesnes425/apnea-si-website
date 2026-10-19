import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type Stripe from "stripe";
import {
  planSchema,
  fingerprint,
  invoicePaymentNotice,
  invoiceConsentHash,
} from "./plan";
import {
  firstInvoiceParams,
  verifyFirstInvoice,
  submitInvitation,
  cancelFirstInvoice,
} from "./invitation";
import type { PlanRecord } from "./store";
import { trainingStripe } from "@/lib/stripe/training-client";
import { paidInvoiceIntent } from "./webhook";
process.env.TRAINING_STRIPE_SECRET_KEY = "sk_test_synthetic";

const manifest = planSchema.parse(
  JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8")),
);
process.env.TUITION_ITEMS_JSON = JSON.stringify({
  "TEST-POOL": { stripeProductId: "prod_synthetic", minimaxItemId: 2 },
});
function record(): PlanRecord {
  return {
    id: manifest.id,
    manifest,
    fingerprint: fingerprint(manifest),
    customer_id: "cus_synthetic",
    first_payment_flow: "stripe_invoice",
    invitation_state: "not_sent",
  } as PlanRecord;
}
function invoice(r = record()): Stripe.Invoice {
  const params = firstInvoiceParams(r, r.customer_id!);
  return {
    ...params,
    id: "in_synthetic",
    livemode: false,
    currency: "eur",
    status: "open",
    customer_email: manifest.payer.email,
    footer: params.footer ?? null,
    parent: null,
    discounts: [],
    default_tax_rates: [],
    automatic_tax: { enabled: false },
    total_taxes: [],
    total: 32500,
    amount_due: 32500,
    lines: {
      has_more: false,
      data: [
        {
          amount: 32500,
          quantity: 1,
          metadata: { planId: manifest.id },
          pricing: { price_details: { product: "prod_synthetic" } },
        },
      ],
    },
  } as unknown as Stripe.Invoice;
}
test("Stripe draft excludes automatic sending, pending items and taxes; explains the exact finite card arrangement", () => {
  const r = record(),
    p = firstInvoiceParams(r, r.customer_id!);
  assert.equal(p.collection_method, "send_invoice");
  assert.equal(p.auto_advance, false);
  assert.equal(p.pending_invoice_items_behavior, "exclude");
  assert.deepEqual(p.payment_settings?.payment_method_types, ["card"]);
  assert.match(p.description!, /325,00/);
  assert.match(p.description!, /260,00/);
  assert.match(p.description!, /11\. 12\. 2026/);
  assert.match(p.description!, /S plačilom soglašate/);
  assert.match(p.description!, /Minimaxa/);
  assert.equal(
    (p.metadata as Record<string, string>).consent_hash,
    invoiceConsentHash(manifest),
  );
  assert.equal(p.description, invoicePaymentNotice(manifest));
});
test("payment request validation rejects changed prices, customers, consent, extra items, taxes and automatic processing", () => {
  const r = record(),
    valid = invoice(r);
  verifyFirstInvoice(valid, r);
  for (const patch of [
    { total: 32600 },
    { amount_due: 32000 },
    { customer: "cus_other" },
    { customer_email: "other@example.invalid" },
    { livemode: true },
    { description: "changed consent" },
    { metadata: { ...valid.metadata, consent_hash: "changed" } },
    { auto_advance: true },
    { default_tax_rates: ["txr_other"] },
    { status: "void" },
    {
      lines: {
        ...valid.lines,
        data: [...valid.lines.data, valid.lines.data[0]],
      },
    },
  ])
    assert.throws(() =>
      verifyFirstInvoice({ ...valid, ...patch } as Stripe.Invoice, r),
    );
  verifyFirstInvoice(
    { ...valid, status: "paid", amount_paid: 32500, amount_remaining: 0 },
    r,
  );
  assert.throws(() =>
    verifyFirstInvoice({ ...valid, status: "paid", amount_paid: 32000 }, r),
  );
});
test("only a genuinely empty draft can recover the line-item creation stage", () => {
  const r = record(),
    valid = invoice(r);
  const empty = {
    ...valid,
    status: "draft",
    total: 0,
    lines: { ...valid.lines, data: [] },
  } as Stripe.Invoice;
  verifyFirstInvoice(empty, r, true);
  assert.throws(() => verifyFirstInvoice(empty, r));
  assert.throws(() =>
    verifyFirstInvoice({ ...empty, status: "open" }, r, true),
  );
});
test("replaying send submits just one Stripe email request", async () => {
  const r = record();
  let calls = 0;
  const deps = {
    save: async (patch: Partial<PlanRecord>) => {
      Object.assign(r, patch);
    },
    send: async () => {
      calls++;
    },
  };
  await submitInvitation(r, deps);
  await submitInvitation(r, deps);
  assert.equal(calls, 1);
  assert.equal(r.invitation_state, "submitted");
  assert.ok(r.invitation_requested_at);
  assert.ok(r.invitation_submitted_at);
});
test("provider timeout holds invitation as uncertain and never auto-resends", async () => {
  const r = record();
  let calls = 0;
  const deps = {
    save: async (patch: Partial<PlanRecord>) => {
      Object.assign(r, patch);
    },
    send: async () => {
      calls++;
      throw new Error("accepted, response lost");
    },
  };
  await assert.rejects(() => submitInvitation(r, deps));
  await assert.rejects(() => submitInvitation(r, deps), /Inspect invitation provider/);
  assert.equal(calls, 1);
  assert.equal(r.invitation_state, "uncertain");
});
test("lost DB acknowledgment after provider acceptance cannot duplicate the email", async () => {
  const r = record();
  let calls = 0;
  const deps = {
    save: async (patch: Partial<PlanRecord>) => {
      if (patch.invitation_state === "submitted")
        throw new Error("DB unavailable");
      Object.assign(r, patch);
    },
    send: async () => {
      calls++;
    },
  };
  await assert.rejects(() => submitInvitation(r, deps));
  await assert.rejects(() => submitInvitation(r, deps), /Inspect invitation provider/);
  assert.equal(calls, 1);
  assert.equal(r.invitation_state, "uncertain");
});
test("a crashed sending state is held even after the provider deduplication window", async () => {
  const r = record();
  r.invitation_state = "sending";
  r.invitation_requested_at = "2026-01-01T08:00:00Z";
  await assert.rejects(
    () =>
      submitInvitation(r, {
        save: async (patch) => {
          Object.assign(r, patch);
        },
        send: async () => {
          throw new Error("must never send");
        },
      }),
    /Inspect invitation provider/,
  );
  assert.equal(r.invitation_state, "uncertain");
});

test("long payer/participant/service names do not truncate the future-charge notice", () => {
  const long = {
    ...manifest,
    participant: "A".repeat(150),
    description: "B".repeat(200),
    payer: { ...manifest.payer, name: "C".repeat(150) },
  };
  const notice = invoicePaymentNotice(long);
  assert.ok(notice.length <= 500);
  assert.match(notice, /260,00/);
  assert.match(notice, /11\. 12\. 2026/);
  assert.match(notice, /Minimaxa/);
});

test("cancel recovers an already-deleted draft after a lost acknowledgment", async (t) => {
  const r = record();
  r.first_invoice_id = "in_deleted_synthetic";
  t.mock.method(trainingStripe.invoices, "retrieve", async () => {
    throw Object.assign(new Error("gone"), { code: "resource_missing" });
  });
  await cancelFirstInvoice(r);
});
test("cancel never deletes or voids an already-paid first invoice", async (t) => {
  const r = record();
  r.first_invoice_id = "in_paid_synthetic";
  t.mock.method(trainingStripe.invoices, "retrieve", async () => ({
    ...invoice(r),
    status: "paid",
  }));
  const remove = t.mock.method(trainingStripe.invoices, "del", async () => {
    throw new Error("must not delete");
  });
  const voiding = t.mock.method(
    trainingStripe.invoices,
    "voidInvoice",
    async () => {
      throw new Error("must not void");
    },
  );
  await cancelFirstInvoice(r);
  assert.equal(remove.mock.callCount(), 0);
  assert.equal(voiding.mock.callCount(), 0);
});
test("manual or multiple paid invoice records cannot stand in for a single verified card charge", async (t) => {
  let payments: unknown[] = [
    { status: "paid", payment: { type: "payment_record" } },
  ];
  t.mock.method(trainingStripe.invoicePayments, "list", async () => ({
    has_more: false,
    data: payments,
  }));
  await assert.rejects(
    () => paidInvoiceIntent("in_synthetic"),
    /single verified/,
  );
  payments = [1, 2].map((i) => ({
    status: "paid",
    payment: { type: "payment_intent", payment_intent: "pi_synthetic_" + i },
  }));
  await assert.rejects(
    () => paidInvoiceIntent("in_synthetic"),
    /single verified/,
  );
});
