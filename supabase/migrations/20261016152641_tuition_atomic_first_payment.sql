-- Commit verified first-payment and consent evidence together, under the worker lease.
-- No provider calls, charges, invoices or messages are performed by this migration.
begin;
create function public.tuition_record_first_payment(target_plan uuid, token uuid, payment jsonb, consent jsonb)
returns setof public.tuition_plans
language plpgsql security invoker set search_path='' as $$
declare p public.tuition_plans;
begin
 select * into p from public.tuition_plans
 where id=target_plan and lease_token=token and lease_until>now() for update;
 if not found then raise exception 'plan lease lost'; end if;
 if (payment->>'plan_id')::uuid is distinct from target_plan
    or (payment->>'instalment')::int is distinct from 1
    or (payment->>'amount_cents')::int is distinct from (p.manifest->'first'->>'amountCents')::int
    or nullif(payment->>'id','') is null
    or (p.first_payment_id is not null and p.first_payment_id is distinct from payment->>'id') then
  raise exception 'first payment mismatch';
 end if;
 if p.first_payment_flow='stripe_invoice' then
  if p.first_invoice_id is null or consent->>'consent_invoice_id' is distinct from p.first_invoice_id
     or p.invitation_requested_at is null or p.invitation_state not in ('submitted','sending','uncertain') then
   raise exception 'invoice consent mismatch';
  end if;
 else
  if nullif(consent->>'consent_session_id','') is null
     or consent->>'checkout_id' is distinct from consent->>'consent_session_id'
     or p.checkout_id is distinct from consent->>'checkout_id' then
   raise exception 'checkout consent mismatch';
  end if;
 end if;
 perform public.tuition_record_payment(payment);
 return query update public.tuition_plans set
   first_payment_id=payment->>'id',
   consent_invoice_id=case when p.first_payment_flow='stripe_invoice' then consent->>'consent_invoice_id' else p.consent_invoice_id end,
   consent_session_id=case when p.first_payment_flow='checkout' then consent->>'consent_session_id' else p.consent_session_id end,
   collection_error=null
 where id=target_plan returning *;
end $$;
revoke all on function public.tuition_record_first_payment(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.tuition_record_first_payment(uuid,uuid,jsonb,jsonb) to service_role;

create or replace function public.tuition_pending_plans() returns table(id uuid)
language sql security invoker set search_path='' as $$
 select p.id from public.tuition_plans p where
 (p.cancelled_at is not null and not p.cancellation_confirmed) or
 (p.first_payment_id is not null and p.manifest->'second' is not null and p.schedule_id is null and p.cancelled_at is null) or
 exists(select 1 from public.tuition_payments t where t.plan_id=p.id and
   (t.invoice_state not in ('issued','test_skipped') or t.email_state in ('pending','sending') or
    (t.instalment=1 and (p.first_payment_id is distinct from t.id or
      (p.first_payment_flow='stripe_invoice' and p.consent_invoice_id is null) or
      (p.first_payment_flow='checkout' and p.consent_session_id is null)))))
 order by p.last_attempt_at nulls first,p.created_at limit 50;
$$;
commit;
