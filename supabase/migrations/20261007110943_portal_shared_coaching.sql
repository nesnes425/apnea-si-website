begin;
create table public.portal_additional_coaches (
 session_id uuid primary key references public.portal_sessions(id),
 regular_coach_id uuid not null references public.portal_staff(id),
 coach_id uuid not null references public.portal_staff(id)
);
alter table public.portal_additional_coaches enable row level security;
revoke all on public.portal_additional_coaches from public,anon,authenticated;
create index portal_additional_coaches_actual on public.portal_additional_coaches(coach_id);
create index portal_additional_coaches_regular on public.portal_additional_coaches(regular_coach_id);
create or replace function portal_private.portal_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; result jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized'; end if;
 select jsonb_build_object(
 'staff',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.portal_staff t where active),
 'groups',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from public.portal_groups g where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=g.id and (s.coach_id=actor.id or exists(select 1 from public.portal_additional_coaches ac where ac.session_id=s.id and ac.coach_id=actor.id)))),
 'members',(select coalesce(jsonb_agg((to_jsonb(m)-'source_key')),'[]') from public.portal_members m where actor.role='admin' or exists(select 1 from public.portal_sessions s where (s.coach_id=actor.id or exists(select 1 from public.portal_additional_coaches ac where ac.session_id=s.id and ac.coach_id=actor.id)) and (exists(select 1 from public.portal_memberships e where e.member_id=m.id and e.group_id=s.group_id and s.date>=e.valid_from and (e.valid_until is null or s.date<=e.valid_until)) or exists(select 1 from jsonb_array_elements(s.entries) e where e->>'member_id'=m.id::text)))),
 'memberships',(select coalesce(jsonb_agg(to_jsonb(e)),'[]') from public.portal_memberships e where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=e.group_id and (s.coach_id=actor.id or exists(select 1 from public.portal_additional_coaches ac where ac.session_id=s.id and ac.coach_id=actor.id)) and s.date>=e.valid_from and (e.valid_until is null or s.date<=e.valid_until))),
 'sessions',(select coalesce(jsonb_agg(to_jsonb(s)||jsonb_build_object('coach_ids',array_remove(array[s.coach_id,(select ac.coach_id from public.portal_additional_coaches ac where ac.session_id=s.id)],null),'regular_coach_ids',array_remove(array[s.regular_coach_id,(select ac.regular_coach_id from public.portal_additional_coaches ac where ac.session_id=s.id)],null)) order by s.date,s.starts),'[]') from public.portal_sessions s where actor.role='admin' or (s.coach_id=actor.id or exists(select 1 from public.portal_additional_coaches ac where ac.session_id=s.id and ac.coach_id=actor.id))),
 'programs',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.portal_programs p where published and (now() at time zone 'Europe/Ljubljana')::date between valid_from and valid_until)
 ) into result;
 return result;
end $$;
create or replace function portal_private.portal_search_members(query text, session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=session_id;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized'; end if;
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
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized'; end if;
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
 select concat_ws(' in ',t.name,(select st.name from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id))||', '||g.label||', '||to_char(target.date,'DD. MM. YYYY') into subject from public.portal_staff t,public.portal_groups g where t.id=target.coach_id and t.active and g.id=target.group_id;
 if exists(select 1 from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id and (not st.active or ac.coach_id=target.coach_id)) then raise exception 'invalid second coach';end if;
 if subject is null then raise exception 'inactive coach';end if;
 update public.portal_sessions set entries=packed,comment=note,status='closed',version=version+1,mail_subject=case when note<>'' then subject end,mail_status=case when note='' then 'none' when changed then 'pending' else mail_status end where id=target.id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));
 if note<>'' and changed then insert into public.portal_outbox(session_id,version,subject,body) values(target.id,target.version,subject,note); end if;
 return to_jsonb(target);
end $$;
create or replace function portal_private.portal_assign_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active and role='admin';
 if actor.id is null then raise exception 'unauthorized';end if;
 select * into target from public.portal_sessions s where s.id=session_id for update;
 if target.id is null or target.status<>'planned' or target.version is distinct from expected_version or not exists(select 1 from public.portal_staff t where t.id=coach_id and t.active) then raise exception 'invalid assignment';end if;
 if exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=portal_assign_coach.coach_id) then raise exception 'duplicate coach';end if;
 previous:=to_jsonb(target);
 update public.portal_sessions s set coach_id=portal_assign_coach.coach_id,version=s.version+1 where s.id=session_id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));return to_jsonb(target);
end $$;

create function portal_private.portal_assign_additional_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active and role='admin';
 if actor.id is null then raise exception 'unauthorized';end if;
 select * into target from public.portal_sessions s where s.id=session_id for update;
 if target.id is null or target.status<>'planned' or target.version is distinct from expected_version
 or target.coach_id=portal_assign_additional_coach.coach_id
 or not exists(select 1 from public.portal_staff t where t.id=portal_assign_additional_coach.coach_id and t.active)
 or not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id) then raise exception 'invalid assignment';end if;
 previous:=to_jsonb(target)||jsonb_build_object('additional_coach',(select to_jsonb(ac) from public.portal_additional_coaches ac where ac.session_id=target.id));
 update public.portal_additional_coaches ac set coach_id=portal_assign_additional_coach.coach_id where ac.session_id=target.id;
 update public.portal_sessions s set version=s.version+1 where s.id=target.id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target)||jsonb_build_object('additional_coach',(select to_jsonb(ac) from public.portal_additional_coaches ac where ac.session_id=target.id)));
 return to_jsonb(target);
end $$;
revoke all on function portal_private.portal_assign_additional_coach(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function portal_private.portal_assign_additional_coach(uuid,uuid,integer) to authenticated;
create function public.portal_assign_additional_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb
language plpgsql security invoker set search_path='' as $$begin perform portal_private.check_device_session(true);return portal_private.portal_assign_additional_coach(session_id,coach_id,expected_version);end$$;
revoke all on function public.portal_assign_additional_coach(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.portal_assign_additional_coach(uuid,uuid,integer) to authenticated;
commit;
