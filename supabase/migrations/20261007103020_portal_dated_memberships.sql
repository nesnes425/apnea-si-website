begin;
-- Members remain permanent; enrolments are dated and never deleted by sync.
create table public.portal_memberships (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.portal_members(id),
 group_id uuid not null references public.portal_groups(id),
 valid_from date not null,
 valid_until date,
 source text not null default 'manual',
 recorded_at timestamptz not null default now(),
 check(valid_until is null or valid_until>=valid_from),
 unique(member_id,group_id,valid_from)
);
alter table public.portal_memberships enable row level security;
revoke all on public.portal_memberships from public,anon,authenticated;
create index portal_memberships_group_dates on public.portal_memberships(group_id,valid_from,valid_until);
create index portal_memberships_member on public.portal_memberships(member_id);
insert into public.portal_memberships(member_id,group_id,valid_from,source)
 select m.id,m.group_id,coalesce((select min(s.date) from public.portal_sessions s where s.group_id=m.group_id),(now() at time zone 'Europe/Ljubljana')::date),'legacy' from public.portal_members m;
alter table public.portal_groups add column source_key text unique;
alter table public.portal_members add column source_key text unique;
create table portal_private.roster_sync_runs (
 id bigint generated always as identity primary key,
 observed_at timestamptz not null default now(),
 source_observed_at timestamptz not null,
 summary jsonb not null
);
alter table portal_private.roster_sync_runs enable row level security;
revoke all on portal_private.roster_sync_runs from public,anon,authenticated;
create or replace function portal_private.portal_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; result jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized'; end if;
 select jsonb_build_object(
 'staff',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.portal_staff t where active),
 'groups',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from public.portal_groups g where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=g.id and s.coach_id=actor.id)),
 'members',(select coalesce(jsonb_agg((to_jsonb(m)-'source_key')),'[]') from public.portal_members m where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.coach_id=actor.id and (exists(select 1 from public.portal_memberships e where e.member_id=m.id and e.group_id=s.group_id and s.date>=e.valid_from and (e.valid_until is null or s.date<=e.valid_until)) or exists(select 1 from jsonb_array_elements(s.entries) e where e->>'member_id'=m.id::text)))),
 'memberships',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from public.portal_memberships e where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=e.group_id and s.coach_id=actor.id and s.date>=e.valid_from and (e.valid_until is null or s.date<=e.valid_until))),
 'sessions',(select coalesce(jsonb_agg(to_jsonb(s) order by s.date,s.starts),'[]') from public.portal_sessions s where actor.role='admin' or s.coach_id=actor.id),
 'programs',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.portal_programs p where published and (now() at time zone 'Europe/Ljubljana')::date between valid_from and valid_until)
 ) into result;
 return result;
end $$;
create or replace function portal_private.portal_search_members(query text, session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=session_id;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id) then raise exception 'unauthorized'; end if;
 if length(trim(query))<3 or length(query)>100 then return '[]'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (
 select m.id,m.name,m.group_id from public.portal_members m
 where position(lower(trim(query)) in lower(m.name))>0
 and exists(select 1 from public.portal_memberships e join public.portal_groups g on g.id=e.group_id where e.member_id=m.id and g.season=(select season from public.portal_groups where id=target.group_id) and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until))
 and not exists(select 1 from public.portal_memberships e where e.member_id=m.id and e.group_id=target.group_id and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until))
 order by m.name limit 15) m);
end $$;
create or replace function portal_private.portal_close_session(input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb; item jsonb; member public.portal_members; packed jsonb:='[]'; note text; subject text; changed boolean; roster_ids uuid[]; regular boolean;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=(input->>'session_id')::uuid for update;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id) then raise exception 'unauthorized'; end if;
 if target.version is distinct from (input->>'version')::integer then raise exception 'conflict'; end if;
 if target.status='cancelled' or target.date>(now() at time zone 'Europe/Ljubljana')::date or (target.status='closed' and actor.role<>'admin') then raise exception 'not editable'; end if;
 if jsonb_typeof(input->'entries') is distinct from 'array' or jsonb_array_length(input->'entries')>100 then raise exception 'invalid entries'; end if;
 if (select count(*) from jsonb_array_elements(input->'entries'))<>(select count(distinct e->>'member_id') from jsonb_array_elements(input->'entries') e) then raise exception 'duplicate member'; end if;
 if target.status='closed' then
 select coalesce(array_agg((e->>'member_id')::uuid),'{}') into roster_ids from jsonb_array_elements(target.entries) e where e->>'kind'='regular';
 else
 select coalesce(array_agg(distinct e.member_id),'{}') into roster_ids from public.portal_memberships e where e.group_id=target.group_id and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until);
 end if;
 if exists(select 1 from unnest(roster_ids) mid where not exists(select 1 from jsonb_array_elements(input->'entries') e where e->>'member_id'=mid::text and e->>'kind'='regular')) then raise exception 'incomplete roster';end if;
 for item in select * from jsonb_array_elements(input->'entries') loop
  select m.* into member from public.portal_members m where m.id=(item->>'member_id')::uuid;
  regular:=member.id=any(roster_ids);
  if member.id is null or coalesce(item->>'status','') not in ('present','absent') or coalesce(item->>'kind','') not in ('regular','makeup') or ((item->>'kind'='regular')<>regular) then raise exception 'invalid member'; end if;
  if not regular and not exists(select 1 from public.portal_memberships e join public.portal_groups g on g.id=e.group_id where e.member_id=member.id and g.season=(select season from public.portal_groups where id=target.group_id) and target.date>=e.valid_from and (e.valid_until is null or target.date<=e.valid_until)) and not exists(select 1 from jsonb_array_elements(target.entries) e where e->>'member_id'=member.id::text and e->>'kind'='makeup') then raise exception 'inactive makeup member';end if;
  packed:=packed||jsonb_build_array(jsonb_build_object('member_id',member.id,'name',coalesce((select e->>'name' from jsonb_array_elements(target.entries) e where e->>'member_id'=member.id::text),member.name),'status',item->>'status','kind',item->>'kind'));
 end loop;
 note:=trim(coalesce(input->>'comment',''));if length(note)>4000 then raise exception 'comment too long';end if;
 previous:=to_jsonb(target);changed:=target.status<>'closed' or target.comment<>note;
 select t.name||', '||g.label||', '||to_char(target.date,'DD. MM. YYYY') into subject from public.portal_staff t,public.portal_groups g where t.id=target.coach_id and t.active and g.id=target.group_id;
 if subject is null then raise exception 'inactive coach';end if;
 update public.portal_sessions set entries=packed,comment=note,status='closed',version=version+1,mail_subject=case when note<>'' then subject end,mail_status=case when note='' then 'none' when changed then 'pending' else mail_status end where id=target.id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));
 if note<>'' and changed then insert into public.portal_outbox(session_id,version,subject,body) values(target.id,target.version,subject,note); end if;
 return to_jsonb(target);
end $$;
-- Only a trusted server/operator may submit a complete source snapshot.
create function portal_private.sync_roster(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare g jsonb; m jsonb; gid uuid; mid uuid; effective date; observed timestamptz; today date; first_run boolean; added integer:=0; ended integer:=0; old_count integer; removed integer; result jsonb;
begin
 perform pg_advisory_xact_lock(260027);
 observed:=(payload->>'observed_at')::timestamptz;
 today:=(now() at time zone 'Europe/Ljubljana')::date;
 first_run:=not exists(select 1 from portal_private.roster_sync_runs);
 if observed is null or observed>now()+interval '5 minutes' or observed<now()-interval '1 hour' or exists(select 1 from portal_private.roster_sync_runs where source_observed_at>=observed) then raise exception 'stale snapshot';end if;
 effective:=case when first_run then (payload->>'initial_from')::date else date_trunc('week',now() at time zone 'Europe/Ljubljana')::date end;
 if effective is null or effective>today or effective<'2026-09-01'::date then raise exception 'invalid initial date';end if;
 if coalesce(payload->>'source_id','')<>'1f5mlpxe0fmmqtn7VOqC5l6yXtXs2gl7C8BBScZmsUtI' or jsonb_typeof(payload->'groups') is distinct from 'array' or jsonb_array_length(payload->'groups')<>33 then raise exception 'incomplete source';end if;
 if (select count(distinct x->>'key') from jsonb_array_elements(payload->'groups') x)<>33 then raise exception 'duplicate groups';end if;
 if exists(select 1 from public.portal_groups pg where pg.source_key is not null and not exists(select 1 from jsonb_array_elements(payload->'groups') x where x->>'key'=pg.source_key)) then raise exception 'group layout changed';end if;
 for g in select * from jsonb_array_elements(payload->'groups') loop
  if coalesce(g->>'key','')='' or length(g->>'label')>150 or coalesce(g->>'level','') not in ('beginner','advanced','performance','youth','static','mixed') or jsonb_typeof(g->'members') is distinct from 'array' or jsonb_array_length(g->'members')>100 then raise exception 'invalid group';end if;
  if (select count(distinct x->>'key') from jsonb_array_elements(g->'members') x)<>jsonb_array_length(g->'members') then raise exception 'duplicate roster';end if;
  select id into gid from public.portal_groups where source_key=g->>'key';
  -- The sole pilot group is matched explicitly, never by a broad label guess.
  if gid is null and g->>'key'='2026-27|2|Ilirija|21:00' then
   select id into gid from public.portal_groups where season='2026/27' and source_key is null and label='Ilirija · torek 21–22';
  end if;
  if gid is null then
   insert into public.portal_groups(label,season,level,source_key) values(g->>'label','2026/27',g->>'level',g->>'key') returning id into gid;
  else update public.portal_groups set source_key=g->>'key' where id=gid;end if;
  select count(*) into old_count from public.portal_memberships e where e.group_id=gid and e.valid_until is null;
  select count(*) into removed from public.portal_memberships e join public.portal_members p on p.id=e.member_id where e.group_id=gid and e.valid_until is null and not exists(select 1 from jsonb_array_elements(g->'members') x where x->>'key'=p.source_key or (p.source_key is null and x->>'name'=p.name));
  if not first_run and removed>0 and (removed>=5 or removed::numeric/greatest(old_count,1)>0.25) then raise exception 'large removal requires review';end if;
  for m in select * from jsonb_array_elements(g->'members') loop
   if coalesce(m->>'key','')!~'^[a-f0-9]{64}$' or length(trim(coalesce(m->>'name','')))<3 or length(m->>'name')>150 then raise exception 'invalid member';end if;
   select id into mid from public.portal_members where source_key=m->>'key';
   if mid is null and first_run then
    if exists(select 1 from public.portal_members where source_key is null and name=m->>'name') and (select count(distinct x->>'key') from jsonb_array_elements(payload->'groups') gg cross join lateral jsonb_array_elements(gg->'members') x where x->>'name'=m->>'name')>1 then raise exception 'ambiguous source identity';end if;
    if (select count(*) from public.portal_members where source_key is null and name=m->>'name')>1 then raise exception 'ambiguous pilot identity';end if;
    select id into mid from public.portal_members where source_key is null and name=m->>'name';
   end if;
   if mid is null then insert into public.portal_members(name,group_id,source_key) values(m->>'name',gid,m->>'key') returning id into mid;
   else update public.portal_members set source_key=m->>'key' where id=mid;end if;
   update public.portal_memberships set valid_until=null where member_id=mid and group_id=gid and valid_until=today;
   if not exists(select 1 from public.portal_memberships e where e.member_id=mid and e.group_id=gid and e.valid_until is null) then
    insert into public.portal_memberships(member_id,group_id,valid_from,source)
    values(mid,gid,greatest(effective,coalesce((select max(valid_until)+1 from public.portal_memberships where member_id=mid and group_id=gid),effective)),'google-sheet');
    added:=added+1;
   end if;
  end loop;
  update public.portal_memberships e set valid_until=today where e.group_id=gid and e.valid_until is null and not exists(select 1 from jsonb_array_elements(g->'members') x join public.portal_members p on p.source_key=x->>'key' where p.id=e.member_id);
  get diagnostics removed=row_count;ended:=ended+removed;
 end loop;
 result:=jsonb_build_object('groups',33,'memberships_added',added,'memberships_ended',ended,'observed_at',observed);
 insert into portal_private.roster_sync_runs(source_observed_at,summary) values(observed,result);
 return result;
end $$;
revoke all on function portal_private.sync_roster(jsonb) from public,anon,authenticated;
grant execute on function portal_private.sync_roster(jsonb) to service_role;
create function public.portal_sync_roster(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select portal_private.sync_roster(payload)$$;
revoke all on function public.portal_sync_roster(jsonb) from public,anon,authenticated;
grant execute on function public.portal_sync_roster(jsonb) to service_role;

commit;
