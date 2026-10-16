import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type Stripe from "stripe";
import { planSchema, fingerprint, consentText } from "./plan";
import { processTuitionPayment, tuitionReceiptText } from "./processor";
import { secondScheduleParams, verifySecondSchedule } from "./stripe";
import { verifyPaidIntent } from "./webhook";
import type { PaymentRecord, PlanRecord } from "./store";
import { assertIssuedAndPaid } from "../minimax/tuition-invoice";

const example = JSON.parse(
  readFileSync("scripts/tuition-plan.example.json", "utf8"),
);
const plan = planSchema.parse(example);
process.env.TUITION_ITEMS_JSON = JSON.stringify({
  "TEST-POOL": { stripeProductId: "prod_synthetic", minimaxItemId: 2 },
});
function payment(): PaymentRecord {
  return {
    id: "pi_synthetic",
    plan_id: plan.id,
    instalment: 1,
    amount_cents: 32500,
    paid_at: "2026-10-16T08:00:00Z",
    invoice_state: "pending",
    minimax_id: null,
    email_state: "pending",
    email_key: "8426ebfa-03b2-428d-8363-15a5b6c3c31a",
    error: null,
  };
}
const invoice = {
  invoiceId: 123,
  number: "1/2026",
  pdf: { fileName: "racun.pdf", contentBase64: "JVBERi0=" },
};
const live = { ...plan, mode: "live" as const };

test("test payments can never issue a real Minimax invoice or send email", async () => {
  const p = payment();
  const result = await processTuitionPayment(plan, p, {
    save: async (patch) => {
      Object.assign(p, patch);
    },
    issue: async () => {
      throw new Error("Must not issue");
    },
    send: async () => {
      throw new Error("Must not send");
    },
  });
  assert.equal(result, "test_skipped");
  assert.equal(p.invoice_state, "test_skipped");
});
test("replayed successful payment does not issue or email again", async () => {
  const p = payment();
  let issued = 0,
    sent = 0;
  const deps = {
    save: async (patch: Partial<PaymentRecord>) => {
      Object.assign(p, patch);
    },
    issue: async () => {
      issued++;
      return invoice;
    },
    send: async () => {
      sent++;
    },
  };
  await processTuitionPayment(live, p, deps);
  await processTuitionPayment(live, p, deps);
  assert.equal(issued, 1);
  assert.equal(sent, 1);
});
test("accounting failure holds email and preserves a durable creation attempt", async () => {
  const p = payment();
  let sent = 0;
  await assert.rejects(() =>
    processTuitionPayment(live, p, {
      save: async (patch) => {
        Object.assign(p, patch);
      },
      issue: async () => {
        p.invoice_state = "creating";
        throw new Error("Minimax timeout");
      },
      send: async () => {
        sent++;
      },
    }),
  );
  assert.equal(sent, 0);
  assert.equal(p.invoice_state, "creating");
  assert.equal(p.email_state, "pending");
});
test("email accepted followed by failed acknowledgment cannot automatically resend", async () => {
  const p = payment();
  let sent = 0;
  const deps = {
    save: async (patch: Partial<PaymentRecord>) => {
      if (patch.email_state === "sent")
        throw new Error("DB unavailable after provider accepted");
      Object.assign(p, patch);
    },
    issue: async () => invoice,
    send: async () => {
      sent++;
    },
  };
  await assert.rejects(() => processTuitionPayment(live, p, deps));
  assert.equal(p.email_state, "uncertain");
  await processTuitionPayment(live, p, deps);
  assert.equal(sent, 1);
});
test("a crashed sending operation requires provider reconciliation", async () => {
  const p = payment();
  p.email_state = "sending";
  assert.equal(
    await processTuitionPayment(live, p, {
      save: async (patch) => {
        Object.assign(p, patch);
      },
      issue: async () => {
        throw new Error("No new invoice");
      },
      send: async () => {
        throw new Error("No resend");
      },
    }),
    "uncertain",
  );
});
test("unapproved/company/unsigned/ambiguous obligations are rejected", () => {
  for (const key of [
    "agreementSigned",
    "exceptionsResolved",
    "personalPayerOnly",
    "noPreviousPaymentOrInvoice",
  ]) {
    assert.equal(
      planSchema.safeParse({
        ...example,
        approval: { ...example.approval, [key]: false },
      }).success,
      false,
    );
  }
  assert.equal(
    planSchema.safeParse({
      ...example,
      first: { ...example.first, amountCents: "9 × 65" },
    }).success,
    false,
  );
  assert.equal(
    planSchema.safeParse({
      ...example,
      second: { ...example.second, serviceTo: "2025-01-01" },
    }).success,
    false,
  );
  assert.equal(
    planSchema.safeParse({
      ...example,
      firstPaymentDeadline: example.second.chargeAt,
    }).success,
    false,
  );
});
test("approved inputs have a stable fingerprint and exact consent amounts/date", () => {
  assert.equal(
    fingerprint(plan),
    fingerprint(planSchema.parse(JSON.parse(JSON.stringify(plan)))),
  );
  assert.notEqual(
    fingerprint(plan),
    fingerprint({ ...plan, first: { ...plan.first, amountCents: 30000 } }),
  );
  const consent = consentText(plan);
  assert.match(consent, /325,00/);
  assert.match(consent, /260,00/);
  assert.match(consent, /11\. 12\. 2026/);
  assert.match(consent, /shranitvijo kartice/);
});
test("second schedule contains exactly one 260 EUR cycle and cancels at its end", () => {
  const record = {
    id: plan.id,
    manifest: plan,
    customer_id: "cus_synthetic",
  } as PlanRecord;
  const params = secondScheduleParams(record, "pm_synthetic");
  assert.equal(params.end_behavior, "cancel");
  assert.equal(params.start_date, Date.parse(plan.second!.chargeAt) / 1000);
  assert.ok(params.phases);
  assert.equal(params.phases.length, 1);
  const phase = params.phases[0];
  assert.equal(phase.items.length, 1);
  assert.equal(phase.items[0].price_data!.unit_amount, 26000);
  assert.equal(phase.proration_behavior, "none");
  assert.equal(phase.end_date, Date.parse("2027-01-11T08:00:00Z") / 1000);
});
test("a payment must have the exact amount, mode, customer and successful status", () => {
  const intent = {
    status: "succeeded",
    amount: 32500,
    amount_received: 32500,
    currency: "eur",
    customer: "cus_synthetic",
    livemode: false,
  } as Stripe.PaymentIntent;
  const expected = {
    amountCents: 32500,
    customerId: "cus_synthetic",
    live: false,
  };
  verifyPaidIntent(intent, expected);
  for (const patch of [
    { amount_received: 26000 },
    { livemode: true },
    { customer: "cus_other" },
    { status: "processing" },
  ])
    assert.throws(() =>
      verifyPaidIntent(
        { ...intent, ...patch } as Stripe.PaymentIntent,
        expected,
      ),
    );
});
test("month-end dates cannot accidentally create a second billing cycle", () => {
  const record = {
    id: plan.id,
    customer_id: "cus_synthetic",
    manifest: {
      ...plan,
      second: { ...plan.second!, chargeAt: "2027-01-31T08:00:00Z" },
    },
  } as PlanRecord;
  const params = secondScheduleParams(record, "pm_synthetic");
  assert.equal(
    params.phases![0].end_date,
    Date.parse("2027-02-28T08:00:00Z") / 1000,
  );
});
test("recovery refuses a modified, renewing or overcharging schedule", () => {
  const record = {
    id: plan.id,
    customer_id: "cus_synthetic",
    manifest: plan,
  } as PlanRecord;
  const expected = secondScheduleParams(record, "pm_synthetic");
  const valid = {
    customer: record.customer_id,
    metadata: { planId: plan.id },
    end_behavior: "cancel",
    phases: [
      {
        start_date: expected.start_date,
        end_date: expected.phases![0].end_date,
        add_invoice_items: [],
        proration_behavior: "none",
        items: [
          {
            quantity: 1,
            price: {
              currency: "eur",
              unit_amount: 26000,
              recurring: { interval: "month", interval_count: 1 },
            },
          },
        ],
      },
    ],
  } as unknown as Stripe.SubscriptionSchedule;
  verifySecondSchedule(valid, record);
  assert.throws(() =>
    verifySecondSchedule({ ...valid, end_behavior: "release" }, record),
  );
  assert.throws(() =>
    verifySecondSchedule(
      { ...valid, phases: [...valid.phases, valid.phases[0]] },
      record,
    ),
  );
  const changed = structuredClone(valid);
  (changed.phases[0].items[0].price as Stripe.Price).unit_amount = 32500;
  assert.throws(() => verifySecondSchedule(changed, record));
});
test("a PDF/draft is insufficient: invoice must be issued, paid and match the instalment", () => {
  const valid = {
    IssuedInvoiceId: 1,
    DocumentReference: "pi_synthetic",
    Status: "I",
    PaymentStatus: "Placan",
    InvoiceValue: 325,
    PaidValue: 325,
  };
  assertIssuedAndPaid(valid, 32500, "pi_synthetic");
  for (const patch of [
    { Status: "O" },
    { PaymentStatus: "Osnutek" },
    { PaidValue: 0 },
    { InvoiceValue: 260 },
    { DocumentReference: "pi_other" },
  ])
    assert.throws(() =>
      assertIssuedAndPaid({ ...valid, ...patch }, 32500, "pi_synthetic"),
    );
});
test("receipt identifies the participant separately from the payer", () => {
  assert.match(
    tuitionReceiptText(live, payment(), "1/2026"),
    /Preizkusni udeleženec/,
  );
});
