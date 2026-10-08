process.on('uncaughtException', e => { console.error(e.message, e.detail || '', e.where || '', e.position, e.query?.slice(Number(e.position)-100, Number(e.position)+100)); process.exit(1); });
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.env.PORTAL_PGLITE_MODULE).href);
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;
create schema auth;create table auth.users(id uuid primary key);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select current_setting('request.jwt.claims',true)::jsonb$$;
grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`);
const reviewMigration='20261008122202_portal_review_fixes.sql';
for(const file of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')&&f!==reviewMigration).sort())await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
// Reproduce old-version acknowledgments before applying the repair migration.
const legacyCoach='90000000-0000-4000-8000-000000000001';
const legacyGroup='90000000-0000-4000-8000-000000000002';
const legacySessions=['sent','failed','uncertain'].map((status,i)=>({status,id:`90000000-0000-4000-8000-${String(i+3).padStart(12,'0')}`}));
await db.query('insert into auth.users values($1)',[legacyCoach]);
await db.query("insert into portal_staff(id,name,role) values($1,'Legacy synthetic coach','trainer')",[legacyCoach]);
await db.query("insert into portal_groups(id,label,season,level) values($1,'Legacy synthetic group','2026/27','advanced')",[legacyGroup]);
for(const [i,fixture] of legacySessions.entries()) {
 await db.query("insert into portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id,status,version,comment,mail_subject,mail_status) values($1,$2,current_date,$3::time,$4::time,$5,$5,'closed',3,'Legacy comment','Legacy subject','pending')",[fixture.id,legacyGroup,`${17+i}:00`,`${18+i}:00`,legacyCoach]);
 await db.query("insert into portal_outbox(session_id,version,subject,body,status) values($1,2,'Legacy subject','Legacy comment',$2)",[fixture.id,fixture.status]);
}
await db.exec(await readFile(new URL('../supabase/migrations/'+reviewMigration,import.meta.url),'utf8'));
for(const fixture of legacySessions) {
 const repaired=(await db.query('select mail_status,mail_version from portal_sessions where id=$1',[fixture.id])).rows[0];
 assert.deepEqual(repaired,{mail_status:fixture.status,mail_version:2});
 await db.exec('set role service_role');
 assert.equal((await db.query('select * from public.portal_claim_mail($1)',[fixture.id])).rows.length,0);
 await db.exec('reset role');
}
// Remove only synthetic migration fixtures so the independent workflow counts stay exact.
await db.query('delete from portal_outbox where session_id=any($1::uuid[])',[legacySessions.map(f=>f.id)]);
await db.query('delete from portal_sessions where group_id=$1',[legacyGroup]);
await db.query('delete from portal_groups where id=$1',[legacyGroup]);
await db.query('delete from portal_staff where id=$1',[legacyCoach]);
await db.query('delete from auth.users where id=$1',[legacyCoach]);

const ids=Array.from({length:9},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
const [admin,first,second,outsider,group,session,member]=ids;
for(const [i,id] of [admin,first,second,outsider].entries()) {
 await db.query("insert into auth.users values($1)",[id]);
 await db.query("insert into auth.sessions(id,user_id) values($1,$1)",[id]);
 await db.query("insert into portal_staff(id,name,role) values($1,$2,$3)",[id,'Coach '+i,i===0?'admin':'trainer']);
}
await db.query("insert into portal_groups(id,label,season,level) values($1,'Shared','2026/27','advanced')",[group]);
await db.query("insert into portal_members(id,name,group_id) values($1,'Synthetic',$2)",[member,group]);
await db.query("insert into portal_memberships(member_id,group_id,valid_from) values($1,$2,current_date-1)",[member,group]);
await db.query("insert into portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id) values($1,$2,current_date,'20:00','21:00',$3,$3)",[session,group,first]);
await db.query("insert into portal_additional_coaches values($1,$2,$2)",[session,second]);
await db.exec("update portal_private.session_policy set season_end=now()+interval '200 days'");
async function login(id) {
 await db.exec('reset role');
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
 await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({session_id:id})]);
 await db.exec('set role authenticated');
 await rpc('portal_start_device_session',[true]);
}
async function rpc(name,args=[]) {return (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) v`,args)).rows[0].v;}
await login(first);const a=await rpc('portal_snapshot');
await login(second);const b=await rpc('portal_snapshot');assert.deepEqual(a.members,b.members);assert.deepEqual(b.sessions[0].coach_ids,[first,second]);
await login(outsider);await assert.rejects(()=>rpc('portal_assign_additional_coach',[session,outsider,0]));await assert.rejects(()=>rpc('portal_assign_coach',[session,outsider,0]));await login(second);
await assert.rejects(()=>db.exec('select * from portal_additional_coaches'));
await login(outsider);assert.equal((await rpc('portal_snapshot')).sessions.length,0);
await login(admin);await assert.rejects(()=>rpc('portal_assign_additional_coach',[session,first,0]));await assert.rejects(()=>rpc('portal_assign_coach',[session,second,0]));
await login(first);await rpc('portal_assign_additional_coach',[session,outsider,0]);
await login(second);assert.equal((await rpc('portal_snapshot')).sessions.length,0);await assert.rejects(()=>rpc('portal_assign_additional_coach',[session,second,1]));
await login(outsider);const changed=await rpc('portal_snapshot');assert.deepEqual(changed.sessions[0].regular_coach_ids,[first,second]);assert.deepEqual(changed.sessions[0].coach_ids,[first,outsider]);
const input={session_id:session,version:1,entries:[{member_id:member,status:'present',kind:'regular'}],comment:'QA'};
await rpc('portal_close_session',[input]);
await login(first);await assert.rejects(()=>rpc('portal_close_session',[input]));
assert.equal((await rpc('portal_snapshot')).sessions[0].entries.length,1);
await login(admin);await assert.rejects(()=>rpc('portal_assign_additional_coach',[session,second,2]));
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from portal_outbox')).rows[0].n,1);

// Deactivation must revoke login without deleting hours or blocking admin correction.
await db.query('update portal_staff set active=false where id=any($1::uuid[])',[[first,outsider]]);
await login(admin);
const history=await rpc('portal_snapshot');
assert.equal(history.staff.find(c=>c.id===first).active,false);
assert.equal(history.staff.find(c=>c.id===outsider).active,false);
assert.deepEqual(history.sessions[0].coach_ids,[first,outsider]);
let current=await rpc('portal_close_session',[{...input,version:2,entries:[{member_id:member,status:'absent',kind:'regular'}]}]);
assert.equal(current.version,3);
await db.exec('reset role');await assert.rejects(()=>login(first));await db.exec('reset role');
await db.query("insert into portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id) values($1,$2,current_date,'19:00','20:00',$3,$3)",[ids[7],group,first]);
await login(admin);await assert.rejects(()=>rpc('portal_close_session',[{...input,session_id:ids[7],version:0}]));
await assert.rejects(()=>db.query('select * from public.portal_claim_mail($1)',[session]));
async function claim(){await db.exec('reset role;set role service_role');return (await db.query('select * from public.portal_claim_mail($1)',[session])).rows;}
async function mark(id,outcome='sent'){await db.query('select public.portal_mark_mail($1,$2)',[id,outcome]);}
async function stored(){await db.exec('reset role');return (await db.query('select mail_status,mail_version,comment from portal_sessions where id=$1',[session])).rows[0];}
// Attendance-only edits do not orphan an outstanding comment acknowledgment.
let mail=await claim();assert.equal(mail.length,1);assert.equal(mail[0].version,2);
assert.equal((await claim()).length,0);await mark(mail[0].id);
assert.equal((await stored()).mail_status,'sent');
await login(admin);current=await rpc('portal_close_session',[{...input,version:current.version,comment:'B'}]);
current=await rpc('portal_close_session',[{...input,version:current.version,comment:'C'}]);
mail=await claim();assert.equal(mail.length,1);assert.equal(mail[0].body,'C');
// Acknowledging an in-flight old revision cannot overwrite a newer correction.
await login(admin);current=await rpc('portal_close_session',[{...input,version:current.version,comment:'D'}]);
await db.exec('reset role;set role service_role');await mark(mail[0].id);
assert.equal((await stored()).mail_status,'pending');
mail=await claim();assert.equal(mail[0].body,'D');await mark(mail[0].id);
assert.equal((await stored()).mail_status,'sent');
// Removing a pending comment prevents dispatch; superseded text is retained as history.
await login(admin);current=await rpc('portal_close_session',[{...input,version:current.version,comment:'E'}]);
current=await rpc('portal_close_session',[{...input,version:current.version,comment:''}]);
assert.equal((await claim()).length,0);assert.equal((await stored()).mail_status,'none');
assert.equal((await db.query("select count(*)::int n from portal_outbox where status='superseded'")).rows[0].n,2);
// Snapshot reads must not renew inactivity; explicit navigation/mutations do.
await login(admin);await db.exec('reset role');
await db.query("update portal_private.device_sessions set last_seen_at=now()-interval '2 days' where user_id=$1",[admin]);
const seen=async()=>Number((await db.query("select extract(epoch from last_seen_at)::float8 n from portal_private.device_sessions where user_id=$1",[admin])).rows[0].n);
const before=await seen();await db.exec('set role authenticated');await rpc('portal_snapshot');await db.exec('reset role');assert.equal(await seen(),before);
await db.exec('set role authenticated');await rpc('portal_check_device_session',[true]);await db.exec('reset role');assert.ok(await seen()>before);
await db.close();console.log('PASS full migration chain: inactive-coach history/corrections, revoked access, pending/changed/removed/in-flight comment revisions, service-only idempotent dispatch and read-only inactivity checks.');
