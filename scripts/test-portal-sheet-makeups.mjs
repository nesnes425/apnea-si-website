// Isolated PostgreSQL verification; never contacts Supabase or sends mail.
// Run with PORTAL_PGLITE_MODULE pointing to an installed @electric-sql/pglite entry.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.env.PORTAL_PGLITE_MODULE).href);
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create table auth.users(id uuid primary key);
create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz default now());
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('session_id',current_setting('request.jwt.claim.sub',true))$$;
grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;`);
const dir=new URL('../supabase/migrations/',import.meta.url);
const files=(await readdir(dir)).filter(f=>f.endsWith('.sql')).sort();
const target='20261027120000_portal_sheet_makeups.sql';
for(const file of files.filter(f=>f<target)) await db.exec(await readFile(new URL(file,dir),'utf8'));
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const key=n=>String(n).repeat(64).slice(0,64);
const [coach,admin,ilirija,kranj,ana,bor,planned,closed,cancelled,future,nextWeek]=Array.from({length:11},(_,i)=>id(i+1));
await db.exec(`insert into auth.users values('${coach}'),('${admin}');
insert into portal_staff(id,name,role) values('${coach}','Coach','trainer'),('${admin}','Admin','admin');
insert into auth.sessions(id,user_id) select id,id from portal_staff;
insert into portal_private.device_sessions(id,user_id,started_at,expires_at,remembered) select id,id,now(),now()+interval '1 hour',false from portal_staff;
insert into portal_groups(id,label,season,level,source_key) values('${ilirija}','Ilirija · torek','2026/27','advanced','2026-27|2|Ilirija|21:00'),('${kranj}','Kranj · torek','2026/27','beginner','2026-27|2|Kranj|21:00');
insert into portal_members(id,name,group_id,source_key) values('${ana}','Ana','${kranj}','${key(1)}'),('${bor}','Bor','${ilirija}','${key(2)}');
insert into portal_memberships(member_id,group_id,valid_from,source) values('${ana}','${kranj}','2026-10-05','test'),('${bor}','${ilirija}','2026-10-05','test');
insert into portal_sessions(id,group_id,date,starts,ends,regular_coach_id,coach_id,status) values
 ('${planned}','${ilirija}',current_date,'21:00','22:00','${coach}','${coach}','planned'),
 ('${closed}','${ilirija}',current_date-7,'21:00','22:00','${coach}','${coach}','closed'),
 ('${cancelled}','${ilirija}',current_date-14,'21:00','22:00','${coach}','${coach}','cancelled'),
 ('${future}','${ilirija}',current_date+7,'21:00','22:00','${coach}','${coach}','planned'),
 ('${nextWeek}','${kranj}',current_date+7,'21:00','22:00','${coach}','${coach}','planned');`);
await db.exec(await readFile(new URL(target,dir),'utf8'));

async function service(name,payload){await db.exec('reset role;set role service_role');try{return (await db.query(`select public.${name}($1) r`,[payload])).rows[0].r;}finally{await db.exec('reset role');}}
const at=(()=>{let n=0;return()=>new Date(Date.now()-60000+(n++)*1000).toISOString();})();
const today=(await db.query(`select current_date::text d`)).rows[0].d, plus=n=>(new Date(Date.parse(today+'T12:00:00Z')+n*86400000)).toISOString().slice(0,10);
const item=(member,group,date)=>({member_key:key(member),group_key:group,date});
const sheet=items=>({source_id:'1f5mlpxe0fmmqtn7VOqC5l6yXtXs2gl7C8BBScZmsUtI',observed_at:at(),items});
const version=async s=>(await db.query(`select version,entries from portal_sessions where id='${s}'`)).rows[0];
const v0=(await version(planned)).version;
let res=await service('portal_sync_makeups',sheet([
 item(1,'2026-27|2|Ilirija|21:00',today),        // Ana announced on today's Ilirija session
 item(1,'2026-27|2|Ilirija|21:00',plus(-7)),     // recorded session without her
 item(1,'2026-27|2|Ilirija|21:00',plus(-14)),    // cancelled
 item(2,'2026-27|2|Ilirija|21:00',plus(7)),      // Bor is a regular there
 item(9,'2026-27|2|Ilirija|21:00',plus(7)),      // not in the portal
 item(1,'2026-27|2|Ilirija|21:00',plus(1)),      // no session that day
 item(1,'2026-27|5|Koper|19:00',plus(3)),        // group not in the portal
]));
assert.deepEqual(res.statuses,['added','closed_without','cancelled','regular_member','unknown_member','no_session','unknown_group']);
assert.equal(res.added,1);
let s=await version(planned);
assert.equal(s.version,v0+1);
assert.deepEqual(s.entries,[{member_id:ana,name:'Ana',kind:'makeup',source:'tabela'}]);
assert.equal((await version(closed)).entries.length,0);

// Repeating the same sheet changes nothing.
res=await service('portal_sync_makeups',sheet([item(1,'2026-27|2|Ilirija|21:00',today),item(1,'2026-27|2|Ilirija|21:00',plus(7))]));
assert.deepEqual(res.statuses,['listed','added']);
assert.equal((await version(planned)).version,v0+1);
// Replay and non-service callers are rejected.
const replay=sheet([]);replay.observed_at=new Date(Date.now()-3600*1000*2).toISOString();
await assert.rejects(()=>service('portal_sync_makeups',replay),/stale snapshot/);
await db.exec('set role anon');await assert.rejects(()=>db.query('select public.portal_sync_makeups($1)',[sheet([])]));await db.exec('reset role');
// An empty read never clears every announcement.
await assert.rejects(()=>service('portal_sync_makeups',sheet([])),/empty source/);
// A row moved to another date disappears from the old session only.
res=await service('portal_sync_makeups',sheet([item(1,'2026-27|2|Ilirija|21:00',today)]));
assert.equal(res.removed,1);
assert.deepEqual((await version(future)).entries,[]);
assert.equal((await version(planned)).entries.length,1);

// The coach sees Ana and records her like any makeup.
async function login(who){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who]);await db.exec('set role authenticated');}
await login(coach);
const snap=(await db.query('select public.portal_snapshot() s')).rows[0].s;
assert.ok(snap.members.some(m=>m.id===ana));
s=snap.sessions.find(x=>x.id===planned);
await db.query('select public.portal_close_session($1)',[{session_id:planned,version:s.version,comment:'',entries:[{member_id:bor,status:'present',kind:'regular'},{member_id:ana,status:'present',kind:'makeup'}]}]);
await db.exec('reset role');
s=await version(planned);
assert.deepEqual(s.entries.find(e=>e.member_id===ana),{member_id:ana,name:'Ana',status:'present',kind:'makeup'});
// Saved attendance is never changed by later sheet edits.
res=await service('portal_sync_makeups',sheet([item(1,'2026-27|2|Ilirija|21:00',today)]));
assert.deepEqual(res.statuses,['recorded']);
res=await service('portal_sync_makeups',sheet([item(1,'2026-27|2|Kranj|21:00',plus(7))]));
assert.deepEqual(res.statuses,['regular_member']);
assert.equal((await version(planned)).entries.length,2);
console.log('sheet makeup database checks passed');
