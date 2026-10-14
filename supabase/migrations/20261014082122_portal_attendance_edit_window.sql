-- Trainers may correct attendance for 48 elapsed hours from the first save.
-- Corrections, including admin corrections, never restart the clock.
begin;
alter table public.portal_sessions add column first_saved_at timestamptz;
-- Recover the original transition, never the latest edit or migration time.
update public.portal_sessions s set first_saved_at=a.first_saved_at
from (select session_id,min(recorded_at) as first_saved_at
      from public.portal_audit
      where after_value->>'status'='closed'
        and before_value->>'status' is distinct from 'closed'
      group by session_id) a
where a.session_id=s.id and s.status='closed';
-- Legacy closed records without evidence stay admin-only.
create or replace function portal_private.portal_close_session(input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb; item jsonb; member public.portal_members; packed jsonb:='[]'; note text; subject text; changed boolean; roster_ids uuid[]; regular boolean;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=(input->>'session_id')::uuid for update;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized'; end if;
 if target.version is distinct from (input->>'version')::integer then raise exception 'conflict'; end if;
 if target.status='cancelled' or target.date>(now() at time zone 'Europe/Ljubljana')::date  then raise exception 'not editable'; end if;
 if target.status='closed' and actor.role<>'admin' and (target.first_saved_at is null or clock_timestamp()>=target.first_saved_at+interval '48 hours') then raise exception 'Rok 48 ur od prvega shranjevanja je potekel. Popravek naj uredi vodstvo.';end if;
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
 select concat_ws(' in ',t.name,(select st.name from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id))||', '||g.label||', '||to_char(target.date,'DD. MM. YYYY') into subject from public.portal_staff t,public.portal_groups g where t.id=target.coach_id and (t.active or (target.status='closed' and actor.role='admin')) and g.id=target.group_id;
 if exists(select 1 from public.portal_additional_coaches ac join public.portal_staff st on st.id=ac.coach_id where ac.session_id=target.id and ((not st.active and not (target.status='closed' and actor.role='admin')) or ac.coach_id=target.coach_id)) then raise exception 'invalid second coach';end if;
 if subject is null then raise exception 'inactive coach';end if;
 update public.portal_sessions set first_saved_at=case when status='closed' then first_saved_at else clock_timestamp() end,entries=packed,comment=note,status='closed',version=version+1,mail_version=case when note='' then null when changed then version+1 else mail_version end,mail_subject=case when note<>'' then subject end,mail_status=case when note='' then 'none' when changed then 'pending' else mail_status end where id=target.id returning * into target;
 update public.portal_outbox set status='superseded' where session_id=target.id and status='pending' and version is distinct from target.mail_version;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));
 if note<>'' and changed then insert into public.portal_outbox(session_id,version,subject,body) values(target.id,target.version,subject,note); end if;
 return to_jsonb(target);
end $$;
commit;
