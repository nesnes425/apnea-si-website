process.on('uncaughtException', e => { console.error(e.message, e.detail || '', e.where || '', e.position, e.query?.slice(Number(e.position)-100, Number(e.position)+100)); process.exit(1); });
import {readFile} from 'node:fs/promises';
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
for(const file of ['202610060001_trainer_portal.sql','20261007094447_staff_welcome.sql','20261007101058_portal_remembered_sessions.sql','20261007103020_portal_dated_memberships.sql','20261007110943_portal_shared_coaching.sql','20261007112008_portal_trainer_substitution.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));

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
await db.close();console.log('PASS shared roster access, unauthorized reads, secondary substitution, duplicate coach rejection, shared version conflict, one attendance record and one outbox item.');
