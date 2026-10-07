begin;
create table portal_private.session_policy (
 singleton boolean primary key default true check(singleton),
 season_end timestamptz not null
);
insert into portal_private.session_policy values (true, '2027-06-15 00:00:00 Europe/Ljubljana');
create table portal_private.device_sessions (
 id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 started_at timestamptz not null,
 last_seen_at timestamptz not null default now(),
 expires_at timestamptz not null,
 remembered boolean not null,
 revoked_at timestamptz
);
alter table portal_private.session_policy enable row level security;
alter table portal_private.device_sessions enable row level security;
revoke all on portal_private.session_policy,portal_private.device_sessions from public,anon,authenticated;
create index device_sessions_user_idx on portal_private.device_sessions(user_id);

create function portal_private.check_device_session(touch boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s portal_private.device_sessions; actor public.portal_staff; cutoff timestamptz;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized'; end if;
 select d.* into s from portal_private.device_sessions d join auth.sessions a on a.id=d.id
 where d.id=(auth.jwt()->>'session_id')::uuid and d.user_id=actor.id and a.user_id=actor.id for update of d;
 if s.id is null or s.revoked_at is not null then raise exception 'session expired'; end if;
 cutoff:=least(s.expires_at, case when actor.role='admin' then s.started_at+interval '30 days'
 else (select season_end from portal_private.session_policy where singleton) end);
 if now()>=cutoff or now()>=s.last_seen_at+(case when actor.role='admin' then interval '20 days' else interval '30 days' end) then
  raise exception 'session expired';
 end if;
 if touch then update portal_private.device_sessions set last_seen_at=now() where id=s.id;end if;
 return jsonb_build_object('expires_at',cutoff,'remembered',s.remembered);
end $$;

create function portal_private.start_device_session(remember boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.portal_staff; sid uuid; created timestamptz; deadline timestamptz;
begin
 select * into actor from public.portal_staff where id=auth.uid() and active;
 if actor.id is null then raise exception 'unauthorized'; end if;
 sid:=(auth.jwt()->>'session_id')::uuid;
 select created_at into created from auth.sessions where id=sid and user_id=actor.id;
 if created is null or now()>created+interval '5 minutes' then raise exception 'fresh login required'; end if;
 deadline:=case when not coalesce(remember,false) then created+interval '1 hour'
 when actor.role='admin' then created+interval '30 days'
 else (select season_end from portal_private.session_policy where singleton) end;
 if deadline<=now() then raise exception 'season ended';end if;
 insert into portal_private.device_sessions(id,user_id,started_at,expires_at,remembered)
 values(sid,actor.id,created,deadline,coalesce(remember,false)) on conflict(id) do nothing;
 return portal_private.check_device_session(true);
end $$;
create function portal_private.end_device_session() returns void
language sql security definer set search_path='' as $$
 update portal_private.device_sessions set revoked_at=now()
 where id=(auth.jwt()->>'session_id')::uuid and user_id=auth.uid();
$$;
revoke all on function portal_private.check_device_session(boolean),portal_private.start_device_session(boolean),portal_private.end_device_session() from public,anon,authenticated;
grant execute on function portal_private.check_device_session(boolean),portal_private.start_device_session(boolean),portal_private.end_device_session() to authenticated;
create function public.portal_start_device_session(remember boolean) returns jsonb language sql security invoker set search_path='' as $$select portal_private.start_device_session(remember)$$;
create function public.portal_check_device_session(touch boolean default false) returns jsonb language sql security invoker set search_path='' as $$select portal_private.check_device_session(touch)$$;
create function public.portal_end_device_session() returns void language sql security invoker set search_path='' as $$select portal_private.end_device_session()$$;
revoke all on function public.portal_start_device_session(boolean),public.portal_check_device_session(boolean),public.portal_end_device_session() from public,anon,authenticated;
grant execute on function public.portal_start_device_session(boolean),public.portal_check_device_session(boolean),public.portal_end_device_session() to authenticated;

-- Enforce the same limits on direct RPC calls, not only the web page.
create or replace function public.portal_snapshot() returns jsonb language plpgsql security invoker set search_path='' as $$begin perform portal_private.check_device_session(true);return portal_private.portal_snapshot();end$$;
create or replace function public.portal_search_members(query text,session_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform portal_private.check_device_session(true);return portal_private.portal_search_members(query,session_id);end$$;
create or replace function public.portal_close_session(input jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform portal_private.check_device_session(true);return portal_private.portal_close_session(input);end$$;
create or replace function public.portal_assign_coach(session_id uuid,coach_id uuid,expected_version integer) returns jsonb language plpgsql security invoker set search_path='' as $$begin perform portal_private.check_device_session(true);return portal_private.portal_assign_coach(session_id,coach_id,expected_version);end$$;
commit;
