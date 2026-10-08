// Run with PORTAL_PGLITE_MODULE pointing to an installed @electric-sql/pglite entry.
// A local Postgres emulator: never connects to the actual Supabase project.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const modulePath = process.env.PORTAL_PGLITE_MODULE;
if (!modulePath)
  throw new Error("Set PORTAL_PGLITE_MODULE to the test-only PGlite module.");
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610060001_trainer_portal.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const admin = "00000000-0000-4000-8000-000000000001",
  trainer = "00000000-0000-4000-8000-000000000002",
  other = "00000000-0000-4000-8000-000000000003",
  member = "00000000-0000-4000-8000-000000000004",
  group = "00000000-0000-4000-8000-000000000005",
  session = "00000000-0000-4000-8000-000000000006";
await db.exec(
  `insert into auth.users values('${admin}'),('${trainer}'),('${other}'); insert into public.portal_staff values('${admin}','Admin','admin',true),('${trainer}','Trainer','trainer',true),('${other}','Other','trainer',true); insert into public.portal_groups values('${group}','Test group','2026/27','advanced'); insert into public.portal_members values('${member}','Test member','${group}'); insert into public.portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id) values('${session}','${group}',current_date,'21:00','22:00','${trainer}','${trainer}'); insert into public.portal_programs(level,valid_from,valid_until,content,published) values('advanced',current_date-1,current_date+1,'CURRENT',true),('advanced',current_date-9,current_date-7,'ARCHIVE',true),('beginner',current_date-1,current_date+1,'DRAFT',false);`,
);
async function login(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
async function rpc(name, args = []) {
  return (
    await db.query(
      `select public.${name}(${args.map((_, i) => "$" + (i + 1)).join(",")}) as value`,
      args,
    )
  ).rows[0].value;
}
const input = {
  session_id: session,
  version: 0,
  comment: "Test comment",
  entries: [{ member_id: member, status: "present", kind: "regular" }],
};
await login(other);
assert.equal((await rpc("portal_snapshot")).sessions.length, 0);
assert.equal((await rpc("portal_snapshot")).members.length, 0);
await assert.rejects(() => rpc("portal_close_session", [input]));
await login(trainer);
await assert.rejects(() => db.exec("select * from public.portal_members"));
assert.deepEqual(
  (await rpc("portal_snapshot")).programs.map((p) => p.content),
  ["CURRENT"],
);
await assert.rejects(() => rpc("portal_assign_coach", [session, other, 0]));
await assert.rejects(() =>
  rpc("portal_close_session", [{ ...input, version: null }]),
);
await assert.rejects(() =>
  rpc("portal_close_session", [{ ...input, entries: [] }]),
);
await assert.rejects(() =>
  rpc("portal_close_session", [
    { ...input, entries: [...input.entries, ...input.entries] },
  ]),
);
await login(admin);
await assert.rejects(() => rpc("portal_assign_coach", [session, other, null]));
await rpc("portal_assign_coach", [session, other, 0]);
await login(trainer);
assert.equal((await rpc("portal_snapshot")).sessions.length, 0);
await assert.rejects(() =>
  rpc("portal_close_session", [{ ...input, version: 1 }]),
);
await login(other);
const closed = await rpc("portal_close_session", [{ ...input, version: 1 }]);
assert.equal(closed.version, 2);
assert.equal(closed.mail_status, "pending");
assert.match(closed.mail_subject, /^Other, Test group,/);
await assert.rejects(() =>
  rpc("portal_close_session", [{ ...input, version: 1 }]),
);
await assert.rejects(() => rpc("portal_claim_mail", [session]));
await db.exec("reset role");
assert.equal(
  (await db.query("select count(*)::int as n from public.portal_outbox"))
    .rows[0].n,
  1,
);
await db.exec("set role service_role");
const claimed = await db.query("select * from public.portal_claim_mail($1)", [
  session,
]);
assert.equal(claimed.rows.length, 1);
assert.equal(
  (await db.query("select * from public.portal_claim_mail($1)", [session])).rows
    .length,
  0,
);
await rpc("portal_mark_mail", [claimed.rows[0].id, "sent"]);
await login(admin);
await rpc("portal_close_session", [{ ...input, version: 2 }]);
await db.exec("reset role");
assert.equal(
  (await db.query("select count(*)::int as n from public.portal_outbox"))
    .rows[0].n,
  1,
);
await db.exec(
  `update public.portal_staff set active=false where id='${other}'`,
);
await login(other);
await assert.rejects(() => rpc("portal_snapshot"));
await db.exec("reset role; set role anon");
await assert.rejects(() => rpc("portal_snapshot"));
await assert.rejects(() => db.exec("select * from public.portal_members"));
await db.close();
console.log(
  "PASS: private reads, role boundaries, revocation, archive filtering, assignment, complete roster, duplicate rejection, version conflicts, audit writes, one-time mail claiming.",
);
