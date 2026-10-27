-- Pre-announced makeups from the master sheet (Katarina, October 27, 2026).
-- Makeups ("Nadomeščanje" rows of the sheet log) are listed on planned sessions
-- as kind=makeup entries without a status, marked source=tabela; the coach still
-- records attendance. Closed and cancelled sessions are never changed.
begin;

create table portal_private.makeup_sync_runs (
 id bigint generated always as identity primary key,
 observed_at timestamptz not null default now(),
 source_observed_at timestamptz not null,
 summary jsonb not null
);
alter table portal_private.makeup_sync_runs enable row level security;
revoke all on portal_private.makeup_sync_runs from public,anon,authenticated;

-- Only a trusted server/operator may submit the complete list of sheet makeups.
-- Returns one status per item, in payload order, for the operator report.
create function portal_private.sync_makeups(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item jsonb; mid uuid; mname text; gid uuid; day date; target public.portal_sessions; previous jsonb; observed timestamptz; status text; statuses jsonb:='[]'; wanted jsonb:='[]'; added integer:=0; removed integer:=0; result jsonb;
begin
 perform pg_advisory_xact_lock(260027);
 observed:=(payload->>'observed_at')::timestamptz;
 if observed is null or observed>now()+interval '5 minutes' or observed<now()-interval '1 hour' or exists(select 1 from portal_private.makeup_sync_runs where source_observed_at>=observed) then raise exception 'stale snapshot';end if;
 if coalesce(payload->>'source_id','')<>'1f5mlpxe0fmmqtn7VOqC5l6yXtXs2gl7C8BBScZmsUtI' or jsonb_typeof(payload->'items') is distinct from 'array' or jsonb_array_length(payload->'items')>2000 then raise exception 'incomplete source';end if;
 -- An empty read must never clear every announced makeup.
 if jsonb_array_length(payload->'items')=0 and exists(select 1 from public.portal_sessions s,jsonb_array_elements(s.entries) e where s.status='planned' and e->>'source'='tabela') then raise exception 'empty source';end if;
 for item in select * from jsonb_array_elements(payload->'items') loop
  if coalesce(item->>'member_key','')!~'^[a-f0-9]{64}$' or coalesce(item->>'group_key','')!~'^2026-27\|[1-5]\|[^|]{2,40}\|[0-2][0-9]:[0-5][0-9]$' or coalesce(item->>'date','')!~'^2026-(09|1[0-2])-[0-3][0-9]$|^2027-0[1-7]-[0-3][0-9]$' then raise exception 'invalid item';end if;
  day:=(item->>'date')::date;
  mid:=null;gid:=null;target:=null;
  select id,name into mid,mname from public.portal_members where source_key=item->>'member_key';
  select id into gid from public.portal_groups where source_key=item->>'group_key';
  if mid is null then status:='unknown_member';
  elsif gid is null then status:='unknown_group';
  else
   select * into target from public.portal_sessions where group_id=gid and date=day order by starts limit 1 for update;
   if target.id is null then status:='no_session';
   elsif target.status='cancelled' then status:='cancelled';
   elsif target.status='closed' then
    status:=case when exists(select 1 from jsonb_array_elements(target.entries) e where e->>'member_id'=mid::text) then 'recorded' else 'closed_without' end;
   elsif exists(select 1 from public.portal_memberships e where e.member_id=mid and e.group_id=gid and day>=e.valid_from and (e.valid_until is null or day<=e.valid_until)) then status:='regular_member';
   else
    wanted:=wanted||jsonb_build_array(jsonb_build_object('session_id',target.id,'member_id',mid));
    if exists(select 1 from jsonb_array_elements(target.entries) e where e->>'member_id'=mid::text) then status:='listed';
    else
     previous:=to_jsonb(target);
     update public.portal_sessions set entries=entries||jsonb_build_array(jsonb_build_object('member_id',mid,'name',mname,'kind','makeup','source','tabela')),version=version+1 where id=target.id returning * into target;
     insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,'00000000-0000-0000-0000-000000000000',previous,to_jsonb(target));
     added:=added+1;status:='added';
    end if;
   end if;
  end if;
  statuses:=statuses||to_jsonb(status);
 end loop;
 -- Rows deleted or changed in the sheet disappear from sessions not yet recorded.
 for target in select s.* from public.portal_sessions s where s.status='planned' and exists(select 1 from jsonb_array_elements(s.entries) e where e->>'source'='tabela' and not exists(select 1 from jsonb_array_elements(wanted) w where w->>'session_id'=s.id::text and w->>'member_id'=e->>'member_id')) for update loop
  previous:=to_jsonb(target);
  update public.portal_sessions s set entries=(select coalesce(jsonb_agg(e),'[]') from jsonb_array_elements(target.entries) e where not (e->>'source'='tabela' and not exists(select 1 from jsonb_array_elements(wanted) w where w->>'session_id'=target.id::text and w->>'member_id'=e->>'member_id'))),version=s.version+1 where s.id=target.id returning * into target;
  removed:=removed+jsonb_array_length(previous->'entries')-jsonb_array_length(target.entries);
  insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,'00000000-0000-0000-0000-000000000000',previous,to_jsonb(target));
 end loop;
 result:=jsonb_build_object('items',jsonb_array_length(payload->'items'),'added',added,'removed',removed,'statuses',statuses,'observed_at',observed);
 insert into portal_private.makeup_sync_runs(source_observed_at,summary) values(observed,result);
 return result;
end $$;
revoke all on function portal_private.sync_makeups(jsonb) from public,anon,authenticated;
grant execute on function portal_private.sync_makeups(jsonb) to service_role;
create function public.portal_sync_makeups(payload jsonb) returns jsonb language sql security invoker set search_path='' as $$select portal_private.sync_makeups(payload)$$;
revoke all on function public.portal_sync_makeups(jsonb) from public,anon,authenticated;
grant execute on function public.portal_sync_makeups(jsonb) to service_role;

commit;
