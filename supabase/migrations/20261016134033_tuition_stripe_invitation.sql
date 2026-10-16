-- No financial documents or messages are created by this migration.
-- Existing Checkout obligations keep their original collection flow.
begin;
alter table public.tuition_plans
 add column first_payment_flow text not null default 'checkout'
   check(first_payment_flow in ('checkout','stripe_invoice')),
 add column first_invoice_id text unique,
 add column consent_invoice_id text unique,
 add column invitation_state text not null default 'not_sent'
   check(invitation_state in ('not_sent','sending','submitted','uncertain')),
 add column invitation_requested_at timestamptz,
 add column invitation_submitted_at timestamptz;
-- Existing RLS, private table grants and invoker/lease RPCs still apply.
commit;
