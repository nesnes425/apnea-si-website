import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.env.PORTAL_PGLITE_MODULE).href);
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
// Match the hosted project's default ACL, not vanilla PostgreSQL defaults.
await db.exec('alter default privileges in schema public grant all on tables to anon, authenticated, service_role;');
for(const f of ['202610160001_tuition_bridge.sql','20261019105859_tuition_email_delivery.sql']) await db.exec(await readFile(`supabase/migrations/${f}`,'utf8'));
const id='b41d5dd2-ff7a-45a6-935a-d08b03f9d525';
const event={event_key:'a'.repeat(64),delivery_id:id,message_id:'synthetic@brevo',recipient:'test@example.invalid',event:'delivered',occurred_at:'2026-10-19T09:00:00Z',reason:null};
const call=(e=event)=>db.query('select public.tuition_email_event($1) as accepted',[e]);
const submit=(provider='synthetic@brevo')=>db.query('select public.tuition_email_submitted($1,$2)',[id,provider]);
for(const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  await assert.rejects(()=>db.exec('select * from public.tuition_email_deliveries'));
  await assert.rejects(()=>db.exec('select * from public.tuition_email_events'));
  await assert.rejects(()=>call()); await assert.rejects(()=>submit());
  await db.exec('reset role');
}
await db.exec('set role service_role');
assert.equal((await call()).rows[0].accepted,false);
await db.query("insert into public.tuition_email_deliveries(id,kind,recipient) values($1,'tuition_test','test@example.invalid')",[id]);
await assert.rejects(()=>db.query("insert into public.tuition_email_deliveries(id,kind,recipient) values($1,'tuition_test','test@example.invalid')",[id]));
// Callback before provider response safely binds the ID. Replay is a no-op.
await call(); await call();
assert.equal((await db.query('select * from public.tuition_email_events')).rows.length,1);
assert.equal((await db.query('select * from public.tuition_email_deliveries')).rows[0].message_id,'synthetic@brevo');
await assert.rejects(()=>call({...event,message_id:'wrong@brevo'}));
await assert.rejects(()=>call({...event,recipient:'wrong@example.invalid'}));
await assert.rejects(()=>submit('wrong@brevo'));
await submit();
const first=(await db.query('select * from public.tuition_email_deliveries')).rows[0];
await submit();
assert.equal((await db.query('select * from public.tuition_email_deliveries')).rows[0].submitted_at.toISOString(),first.submitted_at.toISOString());
await call({...event,delivery_id:null,event_key:'b'.repeat(64),event:'request'});
assert.equal((await db.query('select * from public.tuition_email_events')).rows.length,2);
await assert.rejects(()=>db.exec('delete from public.tuition_email_events'));
await assert.rejects(()=>db.exec("update public.tuition_email_events set reason='rewritten'"));
await assert.rejects(()=>db.exec('truncate public.tuition_email_events'));
await assert.rejects(()=>db.exec('delete from public.tuition_email_deliveries'));
assert.equal((await db.query("select count(*)::int as n from pg_class where relname in ('tuition_email_deliveries','tuition_email_events') and relrowsecurity")).rows[0].n,2);
await db.close();
console.log('Email SQL: RLS/grants, immutable events, unique send lock, early callbacks, duplicate callbacks, identity conflicts, submission replay passed.');
