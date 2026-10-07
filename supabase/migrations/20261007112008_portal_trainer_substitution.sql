begin;
create or replace function portal_private.portal_assign_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized';end if;
 select * into target from public.portal_sessions s where s.id=session_id for update;
 if target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized';end if;
 if target.id is null or target.status<>'planned' or target.version is distinct from expected_version or not exists(select 1 from public.portal_staff t where t.id=coach_id and t.active) then raise exception 'invalid assignment';end if;
 if exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=portal_assign_coach.coach_id) then raise exception 'duplicate coach';end if;
 previous:=to_jsonb(target);
 update public.portal_sessions s set coach_id=portal_assign_coach.coach_id,version=s.version+1 where s.id=session_id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));return to_jsonb(target);
end $$;

create or replace function portal_private.portal_assign_additional_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized';end if;
 select * into target from public.portal_sessions s where s.id=session_id for update;
 if target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id and not exists(select 1 from public.portal_additional_coaches ac where ac.session_id=target.id and ac.coach_id=actor.id)) then raise exception 'unauthorized';end if;
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
commit;
