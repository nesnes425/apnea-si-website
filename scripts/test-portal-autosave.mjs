// Isolated PostgreSQL verification; never contacts Supabase or sends mail.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {randomUUID}=await import('node:crypto');
const {PGlite}=await import(pathToFileURL(process.env.PORTAL_PGLITE_MODULE).href);
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create table auth.users(id uuid primary key);
create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',current_setting('request.jwt.claim.sub',true))$$;
grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;`);
const dir=new URL('../supabase/migrations/',import.meta.url);
for(const file of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file,dir),'utf8'));
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [first,second,third,sub,outsider,admin,member,group,session,otherGroup,otherSession]=Array.from({length:11},(_,i)=>id(i+1));
await db.exec(`insert into auth.users values('${first}'),('${second}'),('${third}'),('${sub}'),('${outsider}'),('${admin}');
insert into portal_staff(id,name,role) values('${first}','First','trainer'),('${second}','Second','trainer'),('${third}','Third','trainer'),('${sub}','Sub','trainer'),('${outsider}','Outsider','trainer'),('${admin}','Admin','admin');
insert into auth.sessions(id,user_id) select id,id from portal_staff;
insert into portal_private.device_sessions(id,user_id,started_at,expires_at,remembered) select id,id,now(),now()+interval '1 hour',false from portal_staff;
insert into portal_groups(id,label,season,level) values('${group}','Three coaches','2026/27','mixed'),('${otherGroup}','Other','2026/27','advanced');
insert into portal_members(id,name,group_id) values('${member}','Test member','${group}');
insert into portal_memberships(member_id,group_id,valid_from,source) values('${member}','${group}',current_date-10,'test');
insert into portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id) values('${session}','${group}',current_date-1,'07:00','08:00','${first}','${first}'),('${otherSession}','${otherGroup}',current_date-1,'07:00','08:00','${outsider}','${outsider}');
insert into portal_additional_coaches(session_id,regular_coach_id,coach_id,slot) values('${session}','${second}','${second}',1),('${session}','${third}','${third}',2);`);
async function login(who){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');}

const member2=id(12),guest=id(13);
await db.exec(`insert into portal_members(id,name,group_id) values('${member2}','Second member','${group}'),('${guest}','Guest','${otherGroup}');
insert into portal_memberships(member_id,group_id,valid_from,source) values('${member2}','${group}',current_date-10,'test'),('${guest}','${otherGroup}',current_date-10,'test');`);
const change=(mid,value,expected,actor=first)=>({type:'attendance',operation_id:randomUUID(),actor_id:actor,session_id:session,member_id:mid,value,expected});
const save=async input=>(await db.query('select public.portal_save_change($1) s',[input])).rows[0].s;
await login(first);
const one=change(member,'present',null);
let result=await save(one);assert.equal(result.ok,true);assert.equal(result.session.status,'planned');assert.equal(result.session.entries.length,1);assert.equal(result.session.attendance_roster.length,2);
const started=result.session.first_saved_at;assert.ok(started);
await login(second);result=await save(change(member2,'absent',null,second));assert.equal(result.ok,true);assert.equal(result.session.status,'closed');assert.equal(result.session.entries.length,2);assert.equal(result.session.first_saved_at,started);
// Editing a different member did not erase the first coach's save.
assert.equal(result.session.entries.find(e=>e.member_id===member).status,'present');
result=await save(change(member,'absent','present',second));assert.equal(result.ok,true);
await login(first);result=await save(one);assert.equal(result.ok,true);assert.equal(result.session.entries.find(e=>e.member_id===member).status,'absent'); // replay cannot revert second coach
result=await save(change(member,'present','present'));assert.equal(result.ok,false);assert.equal(result.conflict,true);
result=await save(change(guest,'present',null));assert.equal(result.session.entries.length,3);
result=await save(change(guest,'remove','present'));assert.equal(result.session.entries.length,2);
await assert.rejects(()=>save(change(member,'remove','absent')),/cannot remove regular/);
await login(outsider);await assert.rejects(()=>save(change(member,'present','absent',outsider)),/unauthorized/);
await login(first);await assert.rejects(()=>save(change(member,'present','absent',second)),/unauthorized/);
// Explicit comment alone creates mail, attendance never does.
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from portal_outbox')).rows[0].n,0);
await login(first);const comment={type:'comment',operation_id:randomUUID(),actor_id:first,session_id:session,value:'Test comment',expected:''};
result=await save(comment);assert.equal(result.ok,true);assert.equal(result.session.first_saved_at,started);
await save(comment);
await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from portal_outbox')).rows[0].n,1);
// Future/cancelled sessions remain protected, including admin access.
await db.exec('reset role');const originalDate=(await db.query('select date::text d from portal_sessions where id=$1',[session])).rows[0].d;
await db.query("update portal_sessions set date=current_date+1 where id=$1",[session]);
await login(admin);await assert.rejects(()=>save(change(member,'present','absent',admin)),/not editable/);
await db.exec('reset role');await db.query("update portal_sessions set date=$2::date,status='cancelled' where id=$1",[session,originalDate]);
await login(admin);await assert.rejects(()=>save(change(member,'present','absent',admin)),/not editable/);
await db.exec('reset role');await db.query("update portal_sessions set status='closed' where id=$1",[session]);
// Backward-compatible saves cannot reset the first-save time.
await login(first);let legacy=(await db.query('select public.portal_close_session($1) s',[{session_id:session,version:result.session.version,entries:result.session.entries,comment:'Test comment'}])).rows[0].s;assert.equal(legacy.first_saved_at,started);
await db.exec('reset role');await db.exec(`update portal_sessions set first_saved_at=clock_timestamp()-interval '167 hours' where id='${session}'`);
await login(first);assert.equal((await save(change(member,'present','absent'))).ok,true);
await db.exec('reset role');await db.exec(`update portal_sessions set first_saved_at=clock_timestamp()-interval '168 hours' where id='${session}'`);
await login(second);await assert.rejects(()=>save(change(member,'absent','present',second)),/edit window expired/);
// Receipts can be acknowledged after expiry; they do not mutate the record.
await login(first);assert.equal((await save(one)).ok,true);
await login(admin);assert.equal((await save(change(member,'absent','present',admin))).ok,true);
await db.exec('reset role');await db.exec(`update portal_sessions set status='planned' where id='${session}'`);
await login(first);await assert.rejects(()=>save(change(member,'present','absent')),/edit window expired/);
await db.exec('reset role');await db.exec(`update portal_staff set active=false where id='${first}'`);
await login(first);await assert.rejects(()=>save(one),/Dostop|unauthorized/);
await db.exec('reset role');await db.exec('set role anon');await assert.rejects(()=>save(one),/permission denied/);
await db.close();console.log('PASS: partial/complete attendance, co-coaches, conflict, replay, guests, no automatic mail, explicit comment once, stable 7-day cutoff (also partial), admin/revoked/anonymous boundaries.');
