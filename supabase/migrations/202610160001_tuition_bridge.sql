-- Financial integration state only. Stripe owns the charge schedule.
begin;
create table public.tuition_plans (
 id uuid primary key,
 manifest jsonb not null,
 fingerprint text not null,
 source_obligation text not null,
 mode text not null check(mode in ('test','live')),
 customer_id text unique, checkout_id text unique, schedule_id text unique,
 first_payment_id text unique,
 consent_session_id text unique,
 cancelled_at timestamptz,
 cancellation_confirmed boolean not null default false,
 cancellation_reason text,
 error text, last_attempt_at timestamptz,
 collection_error text, collection_invoice_id text,
 lease_token uuid, lease_until timestamptz,
 created_at timestamptz not null default now(),
 unique(source_obligation,mode)
);
create table public.tuition_payments (
 id text primary key,
 plan_id uuid not null references public.tuition_plans(id),
 instalment integer not null check(instalment in (1,2)),
 amount_cents integer not null check(amount_cents>0),
 paid_at timestamptz not null,
 invoice_state text not null default 'pending' check(invoice_state in ('pending','creating','created','issued','test_skipped')),
 minimax_id bigint unique,
 email_state text not null default 'pending' check(email_state in ('pending','sending','sent','uncertain','test_skipped')),
 email_key uuid not null default gen_random_uuid(),
 error text,
 unique(plan_id,instalment)
);
alter table public.tuition_plans enable row level security;
alter table public.tuition_payments enable row level security;
revoke all on public.tuition_plans,public.tuition_payments from public,anon,authenticated;
grant all on public.tuition_plans,public.tuition_payments to service_role;

create function public.tuition_claim_plan(target_id uuid,token uuid)
returns setof public.tuition_plans language sql security invoker set search_path='' as $$
 update public.tuition_plans set lease_token=token,lease_until=now()+interval '5 minutes',last_attempt_at=now()
 where id=target_id and (lease_until is null or lease_until<now()) returning *;
$$;
create function public.tuition_record_payment(payment jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare existing public.tuition_payments;
begin
 select * into existing from public.tuition_payments where id=payment->>'id';
 if existing.id is not null then
  if existing.plan_id<>(payment->>'plan_id')::uuid or existing.instalment<>(payment->>'instalment')::int or existing.amount_cents<>(payment->>'amount_cents')::int then raise exception 'payment mismatch';end if;
  return;
 end if;
 insert into public.tuition_payments(id,plan_id,instalment,amount_cents,paid_at)
 values(payment->>'id',(payment->>'plan_id')::uuid,(payment->>'instalment')::int,(payment->>'amount_cents')::int,(payment->>'paid_at')::timestamptz)
 on conflict(id) do nothing;
 select * into existing from public.tuition_payments where id=payment->>'id';
 if existing.plan_id<>(payment->>'plan_id')::uuid or existing.instalment<>(payment->>'instalment')::int or existing.amount_cents<>(payment->>'amount_cents')::int then raise exception 'payment mismatch';end if;
end $$;
revoke all on function public.tuition_claim_plan(uuid,uuid),public.tuition_record_payment(jsonb) from public,anon,authenticated;
grant execute on function public.tuition_claim_plan(uuid,uuid),public.tuition_record_payment(jsonb) to service_role;
create function public.tuition_pending_plans() returns table(id uuid)
language sql security invoker set search_path='' as $$
 select p.id from public.tuition_plans p where
 (p.cancelled_at is not null and not p.cancellation_confirmed) or
 (p.first_payment_id is not null and p.manifest->'second' is not null and p.schedule_id is null and p.cancelled_at is null) or
 exists(select 1 from public.tuition_payments t where t.plan_id=p.id and
   (t.invoice_state not in ('issued','test_skipped') or t.email_state in ('pending','sending')))
 order by p.last_attempt_at nulls first,p.created_at limit 50;
$$;
revoke all on function public.tuition_pending_plans() from public,anon,authenticated;
grant execute on function public.tuition_pending_plans() to service_role;
create function public.tuition_patch_payment(target_plan uuid,token uuid,target_payment text,patch jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.tuition_plans where id=target_plan and lease_token=token and lease_until>now() for update;
 if not found then raise exception 'plan lease lost';end if;
 update public.tuition_payments set
 invoice_state=case when patch?'invoice_state' then patch->>'invoice_state' else invoice_state end,
 minimax_id=case when patch?'minimax_id' then (patch->>'minimax_id')::bigint else minimax_id end,
 email_state=case when patch?'email_state' then patch->>'email_state' else email_state end,
 error=case when patch?'error' then patch->>'error' else error end
 where id=target_payment and plan_id=target_plan;
 if not found then raise exception 'payment not found';end if;
end $$;
revoke all on function public.tuition_patch_payment(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.tuition_patch_payment(uuid,uuid,text,jsonb) to service_role;
commit;
