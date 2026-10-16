// Real PostgreSQL semantics in a disposable local PGlite database. No network.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const modulePath = process.env.PORTAL_PGLITE_MODULE;
if (!modulePath)
  throw new Error(
    "Set PORTAL_PGLITE_MODULE to a test-only @electric-sql/pglite entry",
  );
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
await db.exec(
  "create role anon; create role authenticated; create role service_role bypassrls;",
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610160001_tuition_bridge.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const id = "b41d5dd2-ff7a-45a6-935a-d08b03f9d525",
  token = "17fef203-c2ca-4ef4-99a5-9eeae1250a17";
await db.query(
  "insert into public.tuition_plans(id,manifest,fingerprint,source_obligation,mode) values($1,$2,'hash','obligation-1','test')",
  [id, { second: { amountCents: 26000 } }],
);
for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  await assert.rejects(() => db.exec("select * from public.tuition_plans"));
  await assert.rejects(() => db.exec("select * from public.tuition_payments"));
  await assert.rejects(() =>
    db.query("select * from public.tuition_claim_plan($1,$2)", [id, token]),
  );
  await assert.rejects(() =>
    db.exec("select * from public.tuition_pending_plans()"),
  );
  await db.exec("reset role");
}
await db.exec("set role service_role");
assert.equal(
  (
    await db.query("select * from public.tuition_claim_plan($1,$2)", [
      id,
      token,
    ])
  ).rows.length,
  1,
);
assert.equal(
  (
    await db.query("select * from public.tuition_claim_plan($1,$2)", [
      id,
      token,
    ])
  ).rows.length,
  0,
);
assert.equal(
  (
    await db.query(
      "update public.tuition_plans set customer_id='cus_wrong' where id=$1 and lease_token=gen_random_uuid() returning *",
      [id],
    )
  ).rows.length,
  0,
);
const payment = {
  id: "pi_synthetic",
  plan_id: id,
  instalment: 1,
  amount_cents: 32500,
  paid_at: "2026-10-16T08:00:00Z",
};
for (let n = 0; n < 3; n++)
  await db.query("select public.tuition_record_payment($1)", [payment]);
assert.equal(
  (await db.query("select * from public.tuition_payments")).rows.length,
  1,
);
await db.query("select public.tuition_patch_payment($1,$2,$3,$4)", [
  id,
  token,
  payment.id,
  { invoice_state: "creating" },
]);
await assert.rejects(() =>
  db.query("select public.tuition_patch_payment($1,gen_random_uuid(),$2,$3)", [
    id,
    payment.id,
    { invoice_state: "pending" },
  ]),
);
await assert.rejects(() =>
  db.query("select public.tuition_record_payment($1)", [
    { ...payment, id: "pi_duplicate" },
  ]),
);
await assert.rejects(() =>
  db.query("select public.tuition_record_payment($1)", [
    { ...payment, amount_cents: 26000 },
  ]),
);
await assert.rejects(() =>
  db.query(
    "insert into public.tuition_plans(id,manifest,fingerprint,source_obligation,mode) values(gen_random_uuid(),'{}','hash','obligation-1','test')",
  ),
);
assert.equal(
  (await db.exec("select * from public.tuition_pending_plans()"))[0].rows
    .length,
  1,
);
await db.exec(
  "update public.tuition_payments set invoice_state='issued',email_state='uncertain'; update public.tuition_plans set schedule_id='sub_sched_synthetic'",
);
assert.equal(
  (await db.exec("select * from public.tuition_pending_plans()"))[0].rows
    .length,
  0,
);
await db.exec("update public.tuition_plans set cancelled_at=now()");
assert.equal(
  (await db.exec("select * from public.tuition_pending_plans()"))[0].rows
    .length,
  1,
);
await db.exec(
  "update public.tuition_plans set cancellation_confirmed=true,lease_until=now()-interval '1 second'",
);
await assert.rejects(() =>
  db.query("select public.tuition_patch_payment($1,$2,$3,$4)", [
    id,
    token,
    payment.id,
    { email_state: "sent" },
  ]),
);
assert.equal(
  (
    await db.query("select * from public.tuition_claim_plan($1,$2)", [
      id,
      token,
    ])
  ).rows.length,
  1,
);
await db.close();
console.log(
  "Tuition SQL verified: private access, exclusive leases, replay deduplication, obligation uniqueness, uncertain email hold and cancellation recovery.",
);
