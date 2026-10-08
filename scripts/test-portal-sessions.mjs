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
for(const file of ['202610060001_trainer_portal.sql','20261007101058_portal_remembered_sessions.sql','20261007103020_portal_dated_memberships.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
const user='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002';
await db.exec(`insert into auth.users values('${user}');insert into auth.sessions(id,user_id) values('${sid}','${user}');insert into public.portal_staff values('${user}','QA','trainer',true);update portal_private.session_policy set season_end=now()+interval '200 days';`);
async function owner(sql){await db.exec('reset role');await db.exec(sql);}
async function login(){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({session_id:sid})]);await db.exec('set role authenticated');}
async function rpc(name,args=[]){return (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as v`,args)).rows[0].v;}
await login();await assert.rejects(()=>rpc('portal_snapshot'));
const policy=await rpc('portal_start_device_session',[true]);assert.equal(policy.remembered,true);
await rpc('portal_snapshot');await assert.rejects(()=>db.exec('select * from portal_private.device_sessions'));
await owner("update portal_private.device_sessions set last_seen_at=now()-interval '29 days'");await login();await rpc('portal_check_device_session',[false]);
await owner("update portal_private.device_sessions set last_seen_at=now()-interval '30 days'");await login();await assert.rejects(()=>rpc('portal_check_device_session',[true]));await assert.rejects(()=>rpc('portal_snapshot'));await assert.rejects(()=>rpc('portal_start_device_session',[true]));
await owner("update portal_private.device_sessions set last_seen_at=now();update public.portal_staff set role='admin'");await login();const admin=await rpc('portal_check_device_session',[false]);assert.ok(Date.parse(admin.expires_at)-Date.now()<31*86400000);
await owner("update portal_private.device_sessions set last_seen_at=now()-interval '19 days'");await login();await rpc('portal_check_device_session',[false]);
await owner("update portal_private.device_sessions set last_seen_at=now()-interval '20 days'");await login();await assert.rejects(()=>rpc('portal_snapshot'));
await owner("update portal_private.device_sessions set last_seen_at=now(),started_at=now()-interval '30 days'");await login();await assert.rejects(()=>rpc('portal_snapshot'));
await owner("update public.portal_staff set role='trainer';update portal_private.device_sessions set started_at=now(),last_seen_at=now();update portal_private.session_policy set season_end=now()-interval '1 minute'");await login();await assert.rejects(()=>rpc('portal_snapshot'));
await owner("update portal_private.session_policy set season_end=now()+interval '200 days';update public.portal_staff set active=false");await login();await assert.rejects(()=>rpc('portal_snapshot'));
await owner("update public.portal_staff set active=true");await login();await rpc('portal_end_device_session');await assert.rejects(()=>rpc('portal_snapshot'));await assert.rejects(()=>rpc('portal_start_device_session',[true]));
await owner('delete from portal_private.device_sessions');await login();const short=await rpc('portal_start_device_session',[false]);assert.equal(short.remembered,false);assert.ok(Date.parse(short.expires_at)-Date.now()<=3600000);
await owner("update portal_private.device_sessions set expires_at=now()-interval '1 second'");await login();await assert.rejects(()=>rpc('portal_snapshot'));
await owner("delete from portal_private.device_sessions;update auth.sessions set created_at=now()-interval '6 minutes'");await login();await assert.rejects(()=>rpc('portal_start_device_session',[true]));
await owner('set role anon');await assert.rejects(()=>rpc('portal_start_device_session',[true]));
await db.close();console.log('PASS: 30/20 day inactivity, admin maximum, season end, no limit reset, revocation, short login, fresh-login requirement, anonymous and direct-RPC protection.');
