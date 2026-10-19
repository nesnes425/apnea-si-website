-- Private operational evidence only. No message sending or financial mutations.
begin;
create table public.tuition_email_deliveries (
 id uuid primary key,
 plan_id uuid unique references public.tuition_plans(id),
 kind text not null check (kind in ('tuition_combined','tuition_test')),
 recipient text not null check (length(recipient) between 3 and 320 and recipient=lower(recipient)),
 message_id text unique check (length(message_id) between 1 and 998),
 submission_state text not null default 'sending' check (submission_state in ('sending','submitted','uncertain')),
 created_at timestamptz not null default now(),
 submitted_at timestamptz,
 check ((kind='tuition_combined') = (plan_id is not null))
);
create table public.tuition_email_events (
 event_key text primary key check (event_key ~ '^[a-f0-9]{64}$'),
 delivery_id uuid not null references public.tuition_email_deliveries(id),
 message_id text not null,
 recipient text not null,
 event text not null check(event in ('request','delivered','deferred','soft_bounce','hard_bounce','blocked','invalid_email','error','spam','unsubscribed')),
 occurred_at timestamptz not null,
 reason text check(length(reason)<=500),
 received_at timestamptz not null default now()
);
create index tuition_email_events_delivery_time on public.tuition_email_events(delivery_id,occurred_at);
alter table public.tuition_email_deliveries enable row level security;
alter table public.tuition_email_events enable row level security;
-- Supabase default ACLs can already grant ALL to service_role. Remove those
-- defaults before granting only the operations this append-only evidence needs.
revoke all on public.tuition_email_deliveries, public.tuition_email_events from public, anon, authenticated, service_role;
grant select, insert, update on public.tuition_email_deliveries to service_role;
grant select, insert on public.tuition_email_events to service_role;

create function public.tuition_email_submitted(target_id uuid, provider_id text)
returns void language plpgsql security invoker set search_path='' as $$
declare r public.tuition_email_deliveries;
begin
 select * into r from public.tuition_email_deliveries where id=target_id for update;
 if not found then raise exception 'Unknown delivery'; end if;
 if provider_id is null or length(provider_id) not between 1 and 998
   or (r.message_id is not null and r.message_id<>provider_id) then
   raise exception 'Provider message mismatch';
 end if;
 update public.tuition_email_deliveries set message_id=provider_id,
   submission_state='submitted',submitted_at=coalesce(submitted_at,now()) where id=target_id;
end;
$$;

create function public.tuition_email_event(payload jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.tuition_email_deliveries;
begin
 -- Tags correlate callbacks that arrive before the send response. Without a tag,
 -- the saved provider ID is required. Unknown account mail is not retained.
 if nullif(payload->>'delivery_id','') is not null then
   select * into r from public.tuition_email_deliveries where id=(payload->>'delivery_id')::uuid for update;
 else
   select * into r from public.tuition_email_deliveries where message_id=payload->>'message_id' for update;
 end if;
 if not found then return false; end if;
 if r.recipient is distinct from payload->>'recipient'
   or nullif(payload->>'message_id','') is null
   or (r.message_id is not null and r.message_id<>payload->>'message_id') then
   raise exception 'Delivery evidence mismatch';
 end if;
 update public.tuition_email_deliveries set message_id=payload->>'message_id' where id=r.id;
 insert into public.tuition_email_events(event_key,delivery_id,message_id,recipient,event,occurred_at,reason)
 values(payload->>'event_key',r.id,payload->>'message_id',r.recipient,payload->>'event',
   (payload->>'occurred_at')::timestamptz,payload->>'reason')
 on conflict(event_key) do nothing;
 return true;
end;
$$;
revoke all on function public.tuition_email_submitted(uuid,text), public.tuition_email_event(jsonb) from public,anon,authenticated;
grant execute on function public.tuition_email_submitted(uuid,text), public.tuition_email_event(jsonb) to service_role;
commit;
