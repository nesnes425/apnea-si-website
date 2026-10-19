begin;
alter table public.tuition_plans
 add column invitation_channel text not null default 'stripe' check(invitation_channel in ('stripe','club')),
 add column bank_reference text unique,
 add column bank_iban text,
 add column bank_amount_cents integer check(bank_amount_cents>0),
 add column bank_state text check(bank_state in ('pending','paid','review')),
 add column bank_entry_key text unique,
 add column bank_booked_on date;
create table public.tuition_bank_entries (
 entry_key text primary key check(length(entry_key)=64),
 fingerprint text not null check(length(fingerprint)=64),
 file_hash text not null check(length(file_hash)=64),
 entry jsonb not null,
 plan_id uuid not null references public.tuition_plans(id),
 state text not null default 'pending' check(state in ('pending','paid','review')),
 reason text,
 accounting_state text not null default 'review' check(accounting_state in ('review','recorded')),
 created_at timestamptz not null default now()
);
alter table public.tuition_bank_entries enable row level security;
revoke all on public.tuition_bank_entries from public,anon,authenticated;
grant all on public.tuition_bank_entries to service_role;

-- Register the bank evidence and payment stop together, under the same lease used
-- by card webhooks/schedule creation. A remote failure cannot undo the stop.
create function public.tuition_accept_bank_entry(target_plan uuid,token uuid,k text,fp text,fh text,e jsonb)
returns setof public.tuition_bank_entries language plpgsql security invoker set search_path='' as $$
declare p public.tuition_plans; b public.tuition_bank_entries;
begin
 select * into p from public.tuition_plans where id=target_plan and lease_token=token and lease_until>now() for update;
 if not found then raise exception 'plan lease lost';end if;
 if p.cancelled_at is not null and p.bank_state is null then raise exception 'previously cancelled plan needs review';end if;
 if p.bank_reference is null or p.bank_reference<>e->>'reference' or p.bank_iban<>e->>'account'
 or p.bank_amount_cents<>(e->>'amountCents')::int or e->>'currency'<>'EUR'
 or e->>'direction'<>'CRDT' or e->>'status'<>'BOOK' or (e->>'reversal')::boolean is distinct from false
 or e?'issue' or coalesce(e->>'bankId','')='' then raise exception 'bank evidence mismatch';end if;
 insert into public.tuition_bank_entries(entry_key,fingerprint,file_hash,entry,plan_id)
 values(k,fp,fh,e,target_plan) on conflict(entry_key) do nothing;
 select * into b from public.tuition_bank_entries where entry_key=k for update;
 if b.fingerprint<>fp or b.plan_id<>target_plan then raise exception 'bank identity conflict';end if;
 if p.bank_entry_key is not null and p.bank_entry_key<>k then
  update public.tuition_bank_entries set state='review',reason='additional_bank_payment' where entry_key=k;
  update public.tuition_plans set bank_state='review',error='Additional bank payment requires review' where id=p.id;
 elsif p.bank_entry_key is null then
  update public.tuition_plans set bank_entry_key=k,bank_booked_on=(e->>'bookedOn')::date,bank_state='pending',
   cancelled_at=coalesce(cancelled_at,now()),cancellation_confirmed=false,
   cancellation_reason='Full-season bank payment; stop card collection only',error='Bank/Stripe reconciliation pending'
   where id=p.id;
 end if;
 return query select * from public.tuition_bank_entries where entry_key=k;
end $$;
revoke all on function public.tuition_accept_bank_entry(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.tuition_accept_bank_entry(uuid,uuid,text,text,text,jsonb) to service_role;

create or replace function public.tuition_pending_plans() returns table(id uuid)
language sql security invoker set search_path='' as $$
 select p.id from public.tuition_plans p where
 p.bank_state='pending' or
 (p.bank_state is null and (
 (p.cancelled_at is not null and not p.cancellation_confirmed) or
 (p.first_payment_id is not null and p.manifest->'second' is not null and p.schedule_id is null and p.cancelled_at is null) or
 exists(select 1 from public.tuition_payments t where t.plan_id=p.id and
   (t.invoice_state not in ('issued','test_skipped') or t.email_state in ('pending','sending') or
    (t.instalment=1 and (p.first_payment_id is distinct from t.id or
      (p.first_payment_flow='stripe_invoice' and p.consent_invoice_id is null) or
      (p.first_payment_flow='checkout' and p.consent_session_id is null)))))))
 order by p.last_attempt_at nulls first,p.created_at limit 50;
$$;
commit;
