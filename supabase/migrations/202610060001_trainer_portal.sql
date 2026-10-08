-- Private trainer pilot. Apply only to a dedicated Supabase project after review.
begin;
create table public.portal_staff(id uuid primary key references auth.users(id), name text not null, role text not null check(role in ('admin','trainer')), active boolean not null default true);
create table public.portal_groups(id uuid primary key default gen_random_uuid(), label text not null, season text not null, level text not null);
create table public.portal_members(id uuid primary key default gen_random_uuid(), name text not null, group_id uuid not null references public.portal_groups(id));
create table public.portal_sessions(id uuid primary key default gen_random_uuid(), group_id uuid not null references public.portal_groups(id), date date not null, starts time not null, ends time not null, regular_coach_id uuid not null references public.portal_staff(id), coach_id uuid not null references public.portal_staff(id), status text not null default 'planned' check(status in ('planned','closed','cancelled')), entries jsonb not null default '[]', comment text not null default '' check(length(comment)<=4000), version integer not null default 0, mail_status text not null default 'none', mail_subject text, unique(group_id,date,starts), check(ends>starts));
create table public.portal_programs(id uuid primary key default gen_random_uuid(), level text not null check(level in ('beginner','advanced','performance')), valid_from date not null, valid_until date not null, content text not null, published boolean not null default false, check(valid_until>=valid_from));
create table public.portal_audit(id bigint generated always as identity primary key, session_id uuid not null references public.portal_sessions(id), actor uuid not null, recorded_at timestamptz not null default now(), before_value jsonb not null, after_value jsonb not null);
create table public.portal_outbox(id uuid primary key default gen_random_uuid(), session_id uuid not null references public.portal_sessions(id), version integer not null, subject text not null, body text not null, status text not null default 'pending' check(status in ('pending','sending','sent','failed','uncertain')), created_at timestamptz not null default now(), unique(session_id,version));
alter table public.portal_staff enable row level security;
alter table public.portal_groups enable row level security;
alter table public.portal_members enable row level security;
alter table public.portal_sessions enable row level security;
alter table public.portal_programs enable row level security;
alter table public.portal_audit enable row level security;
alter table public.portal_outbox enable row level security;
revoke all on public.portal_staff,public.portal_groups,public.portal_members,public.portal_sessions,public.portal_programs,public.portal_audit,public.portal_outbox from anon, authenticated;
grant select on public.portal_staff to authenticated;
create policy own_staff on public.portal_staff for select to authenticated using (id=auth.uid() and active);

create function public.portal_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; result jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized'; end if;
 select jsonb_build_object(
 'staff',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.portal_staff t where active),
 'groups',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from public.portal_groups g where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=g.id and s.coach_id=actor.id)),
 'members',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from public.portal_members m where actor.role='admin' or exists(select 1 from public.portal_sessions s where s.group_id=m.group_id and s.coach_id=actor.id)),
 'sessions',(select coalesce(jsonb_agg(to_jsonb(s) order by s.date,s.starts),'[]') from public.portal_sessions s where actor.role='admin' or s.coach_id=actor.id),
 'programs',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.portal_programs p where published and (now() at time zone 'Europe/Ljubljana')::date between valid_from and valid_until)
 ) into result;
 return result;
end $$;

create function public.portal_search_members(query text, session_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=session_id;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id) then raise exception 'unauthorized'; end if;
 if length(trim(query))<3 or length(query)>100 then return '[]'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(m)),'[]') from (select m.* from public.portal_members m join public.portal_groups g on g.id=m.group_id where g.season=(select season from public.portal_groups where id=target.group_id) and m.group_id<>target.group_id and position(lower(trim(query)) in lower(m.name))>0 order by m.name limit 15) m);
end $$;

create function public.portal_close_session(input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb; item jsonb; member public.portal_members; packed jsonb:='[]'; note text; subject text; changed boolean;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 select * into target from public.portal_sessions where id=(input->>'session_id')::uuid for update;
 if actor.id is null or target.id is null or (actor.role<>'admin' and target.coach_id<>actor.id) then raise exception 'unauthorized'; end if;
 if target.version is distinct from (input->>'version')::integer then raise exception 'conflict'; end if;
 if target.status='cancelled' or target.date>(now() at time zone 'Europe/Ljubljana')::date or (target.status='closed' and actor.role<>'admin') then raise exception 'not editable'; end if;
 if jsonb_typeof(input->'entries') is distinct from 'array' or jsonb_array_length(input->'entries')>100 then raise exception 'invalid entries'; end if;
 if (select count(*) from jsonb_array_elements(input->'entries'))<>(select count(distinct e->>'member_id') from jsonb_array_elements(input->'entries') e) then raise exception 'duplicate member'; end if;
 if exists(select 1 from public.portal_members m where m.group_id=target.group_id and not exists(select 1 from jsonb_array_elements(input->'entries') e where e->>'member_id'=m.id::text and e->>'kind'='regular')) then raise exception 'incomplete roster'; end if;
 for item in select * from jsonb_array_elements(input->'entries') loop
  select m.* into member from public.portal_members m join public.portal_groups g on g.id=m.group_id where m.id=(item->>'member_id')::uuid and g.season=(select season from public.portal_groups where id=target.group_id);
  if member.id is null or coalesce(item->>'status','') not in ('present','absent') or coalesce(item->>'kind','') not in ('regular','makeup') or ((item->>'kind'='regular')<>(member.group_id=target.group_id)) then raise exception 'invalid member'; end if;
  packed:=packed||jsonb_build_array(jsonb_build_object('member_id',member.id,'name',member.name,'status',item->>'status','kind',item->>'kind'));
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

create function public.portal_assign_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; target public.portal_sessions; previous jsonb;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active and role='admin';
 if actor.id is null then raise exception 'unauthorized';end if;
 select * into target from public.portal_sessions s where s.id=session_id for update;
 if target.id is null or target.status<>'planned' or target.version is distinct from expected_version or not exists(select 1 from public.portal_staff t where t.id=coach_id and t.active) then raise exception 'invalid assignment';end if;
 previous:=to_jsonb(target);
 update public.portal_sessions s set coach_id=portal_assign_coach.coach_id,version=s.version+1 where s.id=session_id returning * into target;
 insert into public.portal_audit(session_id,actor,before_value,after_value) values(target.id,actor.id,previous,to_jsonb(target));return to_jsonb(target);
end $$;

-- Only the server's service key can claim or acknowledge emails; user JWTs cannot.
create function public.portal_claim_mail(target_id uuid) returns setof public.portal_outbox language sql security definer set search_path='' as $$
 update public.portal_outbox set status='sending' where id=(select id from public.portal_outbox where session_id=target_id and status='pending' order by created_at for update skip locked limit 1) returning *;
$$;
create function public.portal_mark_mail(mail_id uuid,outcome text) returns void language plpgsql security definer set search_path='' as $$
declare msg public.portal_outbox;
begin
 if outcome not in ('sent','failed','uncertain') then raise exception 'invalid outcome';end if;
 update public.portal_outbox set status=outcome where id=mail_id and status='sending' returning * into msg;
 update public.portal_sessions set mail_status=outcome where id=msg.session_id and version=msg.version;
end $$;
revoke all on function public.portal_snapshot(),public.portal_search_members(text,uuid),public.portal_close_session(jsonb),public.portal_assign_coach(uuid,uuid,integer),public.portal_claim_mail(uuid),public.portal_mark_mail(uuid,text) from public,anon,authenticated;
grant execute on function public.portal_snapshot(),public.portal_search_members(text,uuid),public.portal_close_session(jsonb),public.portal_assign_coach(uuid,uuid,integer) to authenticated;
grant execute on function public.portal_claim_mail(uuid),public.portal_mark_mail(uuid,text) to service_role;

-- Privileged implementations stay outside the exposed Data API schema.
create schema portal_private;
revoke all on schema portal_private from public, anon;
grant usage on schema portal_private to authenticated, service_role;
alter function public.portal_snapshot() set schema portal_private;
create function public.portal_snapshot() returns jsonb language sql security invoker set search_path='' as $$ select portal_private.portal_snapshot(); $$;
revoke all on function public.portal_snapshot() from public,anon,authenticated;
grant execute on function public.portal_snapshot() to authenticated;
alter function public.portal_search_members(text,uuid) set schema portal_private;
create function public.portal_search_members(query text, session_id uuid) returns jsonb language sql security invoker set search_path='' as $$ select portal_private.portal_search_members(query,session_id); $$;
revoke all on function public.portal_search_members(text,uuid) from public,anon,authenticated;
grant execute on function public.portal_search_members(text,uuid) to authenticated;
alter function public.portal_close_session(jsonb) set schema portal_private;
create function public.portal_close_session(input jsonb) returns jsonb language sql security invoker set search_path='' as $$ select portal_private.portal_close_session(input); $$;
revoke all on function public.portal_close_session(jsonb) from public,anon,authenticated;
grant execute on function public.portal_close_session(jsonb) to authenticated;
alter function public.portal_assign_coach(uuid,uuid,integer) set schema portal_private;
create function public.portal_assign_coach(session_id uuid, coach_id uuid, expected_version integer) returns jsonb language sql security invoker set search_path='' as $$ select portal_private.portal_assign_coach(session_id,coach_id,expected_version); $$;
revoke all on function public.portal_assign_coach(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.portal_assign_coach(uuid,uuid,integer) to authenticated;
alter function public.portal_claim_mail(uuid) set schema portal_private;
create function public.portal_claim_mail(target_id uuid) returns setof public.portal_outbox language sql security invoker set search_path='' as $$ select * from portal_private.portal_claim_mail(target_id); $$;
revoke all on function public.portal_claim_mail(uuid) from public,anon,authenticated;
grant execute on function public.portal_claim_mail(uuid) to service_role;
alter function public.portal_mark_mail(uuid,text) set schema portal_private;
create function public.portal_mark_mail(mail_id uuid, outcome text) returns void language sql security invoker set search_path='' as $$ select portal_private.portal_mark_mail(mail_id,outcome); $$;
revoke all on function public.portal_mark_mail(uuid,text) from public,anon,authenticated;
grant execute on function public.portal_mark_mail(uuid,text) to service_role;
create index portal_members_group_idx on public.portal_members(group_id);
create index portal_sessions_coach_idx on public.portal_sessions(coach_id);
create index portal_sessions_regular_coach_idx on public.portal_sessions(regular_coach_id);
create index portal_audit_session_idx on public.portal_audit(session_id);
commit;
