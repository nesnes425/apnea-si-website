// Local PostgreSQL integration test. Set PORTAL_PGLITE_MODULE to an installed @electric-sql/pglite dist/index.js.
// No environment files or external services are used.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
assert(
  process.env.PORTAL_PGLITE_MODULE,
  "Set PORTAL_PGLITE_MODULE to a disposable PGlite runtime",
);
const { PGlite } = await import(
  pathToFileURL(process.env.PORTAL_PGLITE_MODULE).href
);
const sourceModule = (path) =>
  import(pathToFileURL(resolve(process.cwd(), path)).href);
Object.assign(process.env, {
  TRAINING_STRIPE_SECRET_KEY: "sk_test_synthetic_review",
  TUITION_ENABLED: "true",
  TUITION_LIVE_ENABLED: "false",
  PORTAL_SUPABASE_URL: "https://db.invalid",
  PORTAL_SUPABASE_SERVICE_KEY: "synthetic-review-only",
  TUITION_ITEMS_JSON: JSON.stringify({
    "TEST-POOL": { stripeProductId: "prod_synthetic", minimaxItemId: 2 },
  }),
});
const { trainingStripe } = await sourceModule("lib/stripe/training-client.ts");
const { planSchema, fingerprint } = await sourceModule("lib/tuition/plan.ts");
const { firstInvoiceParams } = await sourceModule("lib/tuition/invitation.ts");
const { handleTuitionEvent } = await sourceModule("lib/tuition/webhook.ts");
const { processTuitionPlan } = await sourceModule("lib/tuition/worker.ts");
const p = planSchema.parse(
  JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8")),
);
const db = new PGlite();
await db.exec(
  "create role anon; create role authenticated; create role service_role bypassrls;",
);
for (const f of [
  "202610160001_tuition_bridge.sql",
  "20261016134033_tuition_stripe_invitation.sql",
  "20261016152641_tuition_atomic_first_payment.sql",
])
  await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
await db.query(
  "insert into public.tuition_plans(id,manifest,fingerprint,source_obligation,mode,customer_id,first_payment_flow,first_invoice_id,invitation_state,invitation_requested_at) values($1,$2,$3,$4,'test','cus_review','stripe_invoice','in_review','submitted',now())",
  [p.id, p, fingerprint(p), p.source.obligationId],
);
let row = (await db.query("select * from public.tuition_plans")).rows[0];
const invoice = {
  ...firstInvoiceParams(row, "cus_review"),
  id: "in_review",
  livemode: false,
  status: "paid",
  customer_email: p.payer.email,
  footer: null,
  parent: null,
  discounts: [],
  default_tax_rates: [],
  automatic_tax: { enabled: false },
  total_taxes: [],
  total: 32500,
  amount_due: 32500,
  amount_paid: 32500,
  amount_remaining: 0,
  status_transitions: { paid_at: 1792137600 },
  lines: {
    has_more: false,
    data: [
      {
        amount: 32500,
        quantity: 1,
        metadata: { planId: p.id },
        pricing: { price_details: { product: "prod_synthetic" } },
      },
    ],
  },
};
trainingStripe.accounts.retrieve = async () => ({
  id: "acct_1TfaIdEJ7wtq3TXq",
});
trainingStripe.invoices.retrieve = async () => invoice;
trainingStripe.invoicePayments.list = async () => ({
  has_more: false,
  data: [
    {
      status: "paid",
      payment: { type: "payment_intent", payment_intent: "pi_review" },
    },
  ],
});
trainingStripe.paymentIntents.retrieve = async () => ({
  id: "pi_review",
  status: "succeeded",
  currency: "eur",
  amount: 32500,
  amount_received: 32500,
  customer: "cus_review",
  livemode: false,
  setup_future_usage: "off_session",
  payment_method: "pm_review",
  metadata: {
    ...invoice.metadata,
    consent_hash: invoice.metadata.consent_hash,
  },
});
trainingStripe.paymentMethods.retrieve = async () => ({
  id: "pm_review",
  type: "card",
  customer: "cus_review",
});
let scheduleCreates = 0;
let createdSchedule;
trainingStripe.subscriptionSchedules.list = async function* () {
  if (createdSchedule) yield createdSchedule;
};
trainingStripe.subscriptionSchedules.create = async (params) => {
  scheduleCreates++;
  createdSchedule = {
    ...params,
    id: "sub_sched_review",
    status: "not_started",
    phases: params.phases.map((phase) => ({
      ...phase,
      start_date: params.start_date,
      add_invoice_items: [],
      items: phase.items.map((item) => ({
        ...item,
        price: {
          ...item.price_data,
          recurring: { interval: "month", interval_count: 1 },
        },
      })),
    })),
  };
  return createdSchedule;
};
trainingStripe.subscriptionSchedules.retrieve = async () => createdSchedule;
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const u = new URL(String(input));
  assert.equal(u.origin, "https://db.invalid", "No real API calls permitted");
  const path = u.pathname.replace("/rest/v1/", "");
  const body = init.body ? JSON.parse(String(init.body)) : {};
  let result = [];
  if (path === "tuition_plans") {
    if (init.method === "PATCH") {
      const ks = Object.keys(body),
        vs = ks.map((k) => body[k]);
      vs.push(
        u.searchParams.get("id").slice(3),
        u.searchParams.get("lease_token").slice(3),
      );
      result = (
        await db.query(
          "update public.tuition_plans set " +
            ks.map((k, i) => k + "=$" + (i + 1)).join(",") +
            " where id=$" +
            (ks.length + 1) +
            " and lease_token=$" +
            (ks.length + 2) +
            " returning *",
          vs,
        )
      ).rows;
    } else
      result = (
        await db.query("select * from public.tuition_plans where id=$1", [
          u.searchParams.get("id").slice(3),
        ])
      ).rows;
  } else if (path === "tuition_payments")
    result = (
      await db.query("select * from public.tuition_payments where plan_id=$1", [
        u.searchParams.get("plan_id").slice(3),
      ])
    ).rows;
  else if (path === "rpc/tuition_claim_plan")
    result = (
      await db.query("select * from public.tuition_claim_plan($1,$2)", [
        body.target_id,
        body.token,
      ])
    ).rows;
  else if (path === "rpc/tuition_record_first_payment")
    result = (
      await db.query(
        "select * from public.tuition_record_first_payment($1,$2,$3::jsonb,$4::jsonb)",
        [body.target_plan, body.token, body.payment, body.consent],
      )
    ).rows;
  else if (path === "rpc/tuition_record_payment")
    await db.query("select public.tuition_record_payment($1::jsonb)", [
      body.payment,
    ]);
  else if (path === "rpc/tuition_patch_payment")
    await db.query("select public.tuition_patch_payment($1,$2,$3,$4::jsonb)", [
      body.target_plan,
      body.token,
      body.target_payment,
      body.patch,
    ]);
  else throw Error("Unexpected synthetic route " + path);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

try {
  const event = {
    type: "invoice.paid",
    created: 1792137600,
    data: { object: { id: "in_review" } },
  };
  // A server failure after the payment insert rolls back BOTH writes.
  await db.exec(`create function fail_first_pointer() returns trigger language plpgsql as $$ begin
 if new.first_payment_id is not null then raise exception 'Injected transaction failure'; end if; return new; end $$;
 create trigger fail_pointer before update on public.tuition_plans for each row execute function fail_first_pointer();`);
  await assert.rejects(
    () => handleTuitionEvent(event),
    /Injected transaction failure/,
  );
  assert.equal(
    (await db.query("select * from public.tuition_payments")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select first_payment_id from public.tuition_plans"))
      .rows[0].first_payment_id,
    null,
  );
  await db.exec(
    "drop trigger fail_pointer on public.tuition_plans; set role service_role",
  );
  // Seed the old split-write failure, with accounting already finished.
  await db.query(
    "insert into public.tuition_payments(id,plan_id,instalment,amount_cents,paid_at,invoice_state,email_state) values('pi_review',$1,1,32500,now(),'test_skipped','test_skipped')",
    [p.id],
  );
  assert.equal(
    (await db.query("select * from public.tuition_pending_plans()")).rows
      .length,
    1,
  );
  // Wrong/missing consent cannot be upgraded from a payment row alone.
  const hash = invoice.metadata.consent_hash;
  invoice.metadata.consent_hash = "wrong";
  assert.equal((await processTuitionPlan(p.id)).problems.length, 1);
  assert.equal(
    (await db.query("select * from public.tuition_pending_plans()")).rows
      .length,
    1,
  );
  assert.equal(scheduleCreates, 0);
  invoice.metadata.consent_hash = hash;
  const recovery = await processTuitionPlan(p.id);
  assert.deepEqual(recovery.problems, []);
  row = (await db.query("select * from public.tuition_plans")).rows[0];
  assert.equal(row.first_payment_id, "pi_review");
  assert.equal(row.consent_invoice_id, "in_review");
  assert.equal(row.schedule_id, "sub_sched_review");
  assert.equal(scheduleCreates, 1);
  assert.equal(
    (await db.query("select * from public.tuition_pending_plans()")).rows
      .length,
    0,
  );
  await handleTuitionEvent(event);
  await processTuitionPlan(p.id);
  assert.equal(scheduleCreates, 1);
  assert.equal(
    (await db.query("select * from public.tuition_payments")).rows.length,
    1,
  );
  // The same atomic RPC is idempotent, lease-bound and private.
  const { claimPlan, releasePlan, recordFirstPayment } = await sourceModule(
    "lib/tuition/store.ts",
  );
  const locked = await claimPlan(p.id);
  const payment = {
    id: "pi_review",
    plan_id: p.id,
    instalment: 1,
    amount_cents: 32500,
    paid_at: new Date().toISOString(),
  };
  await assert.rejects(
    () =>
      recordFirstPayment(
        { ...locked, lease_token: "00000000-0000-4000-8000-000000000000" },
        payment,
        { consent_invoice_id: "in_review" },
      ),
    /lease lost/,
  );
  await assert.rejects(
    () =>
      recordFirstPayment(
        locked,
        { ...payment, id: "pi_duplicate" },
        { consent_invoice_id: "in_review" },
      ),
    /mismatch/,
  );
  await db.query(
    "update public.tuition_plans set lease_until=now()-interval '1 second' where id=$1",
    [p.id],
  );
  await assert.rejects(
    () =>
      recordFirstPayment(locked, payment, { consent_invoice_id: "in_review" }),
    /lease lost/,
  );
  await releasePlan(locked);
  for (const role of ["anon", "authenticated"]) {
    const allowed = (
      await db.query(
        "select has_function_privilege($1,'public.tuition_record_first_payment(uuid,uuid,jsonb,jsonb)','EXECUTE') as allowed",
        [role],
      )
    ).rows[0].allowed;
    assert.equal(allowed, false);
  }
  // Legacy Checkout also recovers from verified accepted consent.
  await db.query(
    "update public.tuition_plans set first_payment_flow='checkout',first_payment_id=null,consent_invoice_id=null,checkout_id='cs_review' where id=$1",
    [p.id],
  );
  const session = {
    id: "cs_review",
    status: "complete",
    payment_status: "paid",
    mode: "payment",
    consent: { terms_of_service: "accepted" },
    currency: "eur",
    amount_total: 32500,
    customer: "cus_review",
    livemode: false,
    payment_intent: "pi_review",
    metadata: { type: invoice.metadata.type, planId: p.id },
  };
  trainingStripe.checkout.sessions.retrieve = async () => session;
  session.consent.terms_of_service = "none";
  assert.equal((await processTuitionPlan(p.id)).problems.length, 1);
  assert.equal(
    (await db.query("select * from public.tuition_pending_plans()")).rows
      .length,
    1,
  );
  session.consent.terms_of_service = "accepted";
  assert.deepEqual((await processTuitionPlan(p.id)).problems, []);
  row = (await db.query("select * from public.tuition_plans")).rows[0];
  assert.equal(row.consent_session_id, "cs_review");
  assert.equal(row.first_payment_id, "pi_review");
  assert.equal(scheduleCreates, 1);
  console.log(
    "PASS: atomic rollback, legacy invoice/Checkout recovery, invalid consent remains pending, one schedule on replay, expired/wrong leases, duplicate payment and private RPC grants",
  );
} finally {
  globalThis.fetch = nativeFetch;
  await db.close();
}
