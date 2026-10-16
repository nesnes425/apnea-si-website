# Tuition payments: Samo and Katarina

Last updated: October 16, 2026

## Current delivery state

Production PR #30 (`e5dac86`) sends the initial invoice email through Stripe
after explicit `send`; `create` prepares an unsent draft. Its private-state
migration is already applied. Existing Checkout plans keep their original flow.
The local agreement-notice change is not released yet: until its approved release,
production still requires `approval.agreementSigned=true`.

Neža explicitly allows Stripe's payment-request invoice/PDF. Minimax must still
create exactly one official service invoice for each verified paid instalment.
Stripe invoice creation, finalization and sending never trigger a Minimax invoice.

Confirmed by Neža in the October 16 implementation conversation:

- Each paid instalment gets a separate service invoice, not an advance document.
- Both invoices cover **October 5, 2026–June 14, 2027**. Label the instalments clearly.
- First payment deadline: **October 31, 2026**.
- Second payment date: **December 11, 2026**. The example uses 09:00 Ljubljana time;
  Stripe's automatic invoice finalization can delay collection within that day.
- Cancellation deadline from Samo's protocol: November 30, 2026.

Minimax authentication and read access succeeded on October 16 using the
documented Next.js environment loader. Organisation `241557` is **ŠPORTNO DRUŠTVO
APNEA SLOVENIJA**. Samo subsequently confirmed VAT category O at 0%, the exact
clause below on every invoice, domestic revenue account 76010, all ten pool items
and the existing FURS numbering series. The ten tuition items now exist with
verified settings; see the parent hub's `website/tuition-pool-catalog.json`.
No real Minimax document was created. Loading this local
file with Node's `--env-file` instead produced `invalid_grant`; this was a parsing
mismatch, not evidence that the credential needed replacing. Use the loader below.

## Everyday workflow

Samo can ask Codex: “Prepare tuition links for the approved personal-payment rows.”
The assistant reads the authoritative sheet, prepares the approved inputs, shows
the named people, exact amounts, periods and dates, and uses the commands below.
Samo does not need to run commands, configure MCP, or handle Stripe/Minimax keys.

**Mandatory amount review:** prepare a complete review of the source rows for
Samo before creating or sending links. Show participant, actual payer, pool,
total, first/second instalments, dates, prior-payment state and exceptions.
Samo corrects the authoritative Sheet, then the assistant refreshes the review.
Only Samo's explicit approval of the named rows and exact amounts permits setting
their manifest approval fields. General permission to configure the system, a
generated review, or a filled amount cell is not approval to release those rows.
Use the hub's offline `scripts/review-tuition-amounts.mjs` to render the full
private review under ignored `temp/`; do not commit real member data or publish
that report. Draft creation and sending remain separate actions.

Authoritative input: [Vadnina 2026/27 – priprava računov](https://docs.google.com/spreadsheets/d/1WiIeVtQgJR0gKKOEt2-4ZLrJfdJ-AuozVWY0kMpWqHM/edit#gid=0), tab `Sheet1`.
Use its individual approved instalments, never a calculated standard percentage.
The €35 membership is a separate obligation. Sanity is not part of tuition.

Create one approved manifest per personal obligation using
`scripts/tuition-plan.example.json` as a structural example. Its identities and
amounts are synthetic; its dates reflect the confirmed general arrangement.
Save actual manifests under ignored `temp/`, never in Git. Keep the same random
plan UUID, stable payer UUID and `source.obligationId` on every retry. Retain these
IDs in the approved operational input outside Git; row numbers only locate the
source and must not be used as a person's identity. Reuse payerId for the same
actual payer, including different participants; never deduplicate by email.

Set the approved `locationCode` and its server-side `TUITION_ITEMS_JSON` mapping.
Samo chose one item per location/pool on October 15; Ljubljana pools are separate.
Discounts or instalment numbers do not create another service item. The first
Checkout and second schedule reference the same pool product; invoice rows use
that pool's Minimax item.

Exclude company invoices (manual Minimax), bank standing orders and unresolved
exceptions. For a split payer, prepare Stripe only for the specifically approved
personal share; the company share stays manual. Require a signed agreement or
the versioned agreement notice described below,
resolved decisions and an explicit check for existing payments/invoices before
approving a manifest. One-payment exceptions omit `second` entirely.

```sh
# No network or writes. Review this output first.
npm run tuition -- preview temp/tuition-plan.json

# Create the private website payment link after the named plan is approved.
npm run tuition -- create temp/tuition-plan.json --apply

# Read payment, schedule, invoice, delivery and failure states.
npm run tuition -- status PLAN_UUID

# Resume integration work. This never creates another first card payment.
# Live mode can issue the outstanding invoice and email its PDF.
npm run tuition -- sync PLAN_UUID --apply

# Stop an unpaid link and the future schedule. Does not refund earlier payments.
npm run tuition -- cancel PLAN_UUID --reason "Member requested cancellation" --apply
```

`create <manifest> --apply` prepares one unsent Stripe draft and returns the
private status link. After reviewing the payer and exact amounts, explicitly use
`send <plan-uuid> --apply` to finalize the same request, configure its card and
have Stripe send its initial email. The customer is created with Slovenian locale.
The send result `submitted` means Stripe accepted the email request, not proof
of inbox delivery. Test mode emits invoice.sent but never delivers the real email.
Sending invitations/reminders needs the operator's explicit instruction. Do not invent a reminder policy. A repeated
create with identical IDs/input returns the same obligation; changed input or a
duplicate source obligation is rejected for review.

## Agreement acceptance with payment (local change, October 16)

Samo requested that the notice also state that registration and tuition payment
accept the 2026/27 participation agreement. New reviewed manifests use
`agreementNoticeVersion="2026-27-v1"`. Keep `approval.agreementSigned` truthful:
false is accepted only with that explicit notice version and a service period
within the agreement season. Other amount, payer, previous-payment and operator
approval checks remain required. Do not mark a Google Form signed merely because
a request was created or sent. Do not infer a separate liability or guardian
declaration from the new participation-agreement sentence.

The version refers to the existing public PDF linked by `siteConfig.tuitionAgreement2026`
(Drive metadata/read verified October 16), already used in the season emails.
It appears in the Stripe invoice description and the website payment page.
The notice hash covers the agreement text/link as well as the finite card consent;
the verified paid invoice/session is the acceptance evidence. CLI `status` reports
`acceptedWithPayment` only after that evidence and the first payment exist.
The card-storage/second-charge consent is still explicit. Plans without the new
version keep their exact old fingerprints and notices; never retrofit an existing
Stripe invoice by changing only its manifest. No database migration is needed.

Reuse verified membership payer addresses, matching the actual payer rather than
email alone. Missing Sheet address cells are not proof that data was never collected.
Keep address/payment evidence only in ignored operational drafts or source systems.

The CLI now routes `send --apply` to the actual `send` action; it previously
incorrectly called `sync`. Sending still requires a separate explicit instruction.

## Payer and integration flow

1. New obligations create an unsent Stripe invoice with exactly the approved
   first amount, payer, pool product and service period. Automatic advancement and
   pending-item inclusion are off; there is no automatic send or charge on create.
2. Explicit `send` configures the invoice PaymentIntent for off-session reuse
   when a second instalment exists, then calls Stripe's invoice send API. The
   native email and hosted invoice show the exact first/second amounts, second
   date, cancellation deadline, card-storage authorization and terms URL.
   Paying the displayed request is the acceptance action; this native invoice
   flow does not use the legacy Checkout consent checkbox.
3. The first invoice's paid event must match the approved amount, customer, mode,
   document, notice hash and a successful card PaymentIntent. For two instalments,
   the card must be attached to that same customer and configured off_session.
   The invoice ID is stored as the native consent/payment evidence. A manual
   mark-as-paid or modified request cannot trigger Minimax processing.
4. One verified first payment creates the existing finite future schedule:
   one exact second amount on December 11, one phase, end_behavior=cancel,
   no proration. Existing Checkout obligations retain their original processing;
   a new invoice obligation cannot also start a competing Checkout.
5. Each successful card payment has one durable integration record keyed by its
   PaymentIntent and unique plan/instalment. Replayed invoice.paid and
   invoice.payment_succeeded events therefore resume the same Minimax invoice.
   Minimax creates/resumes, issues and verifies its paid service invoice and PDF;
   Brevo delivers the official PDF. Stripe's payment-request document is allowed,
   and does not create an extra Minimax obligation or accounting entry.

No custom charge scheduler runs on Samo's laptop. Stripe owns future collection.
The website owns invoicing/email and recovery. A daily reconciliation cron retries
pending work; Stripe webhook retries and `sync` provide earlier recovery. Check the
operator status after sending links and after the December collection; this initial
version does not send separate failure-alert emails or custom reminders.

## Failures and operator recovery

- `collectionError`: inspect the identified invoice in Stripe. Card failure or
  authentication required is not a paid instalment; no Minimax invoice is issued.
  Use Stripe's hosted invoice/card-authentication flow. Do not create another plan.
- Missing second schedule: `sync` retries it using the same idempotency key and
  searches existing schedules first. A mismatched or multiple schedule is held for
  review. Dates already passed/within one hour require an explicit new arrangement.
- `invoice_state=creating` without Minimax ID: the create outcome is uncertain.
  Recovery searches all pages for that payer and Stripe reference. It resumes a
  found document and never blindly posts a new one. If none is found, verify Minimax
  and reconcile the state as an administrator before allowing another create.
- `invitation_state=sending/uncertain`: inspect Stripe invoice.sent events and
  customer email history before any retry. The operator command and cron never
  automatically resend an ambiguous invitation, including after 24 hours. A
  technical administrator may set submitted only after confirming acceptance, or
  reset not_sent only after confirming no send and receiving resend authorization.
  Replaying a submitted send returns the same result without another provider call.
- `email_state=sending/uncertain`: reconcile Brevo delivery logs first. Automatic
  resend is blocked even after Brevo's short idempotency window expires. A technical
  administrator can mark confirmed delivery as `sent`, or reset to `pending` only
  after confirming no delivery and obtaining resend authorization.
- A requested cancellation is durable before the external cancellation call.
  Confirm cancellation to the payer only when `cancellationConfirmed=true`.
  An already finalized invoice, successful payment, refund or credit note requires
  a separate approved accounting action; cancellation does not undo it.

The bridge verifies issued/paid API status. Accounting must confirm on the first
real approved document that the selected item, tax/fiscalization/payment mapping
also produces the intended ledger posting. A PDF alone is never success.

## One-time server setup (Neža/technical administrator)

Follow the website release gate in `AGENTS.md`: local verification, explicit branch
push approval, PR with passing Vercel preview, then explicit production merge approval.

1. Apply the base `supabase/migrations/202610160001_tuition_bridge.sql` to the same Supabase
   project as the portal. These are new private financial tables. The service role
   can access them; anonymous users and authenticated trainers cannot.
   Production already has the base as tuition_bridge version 20261016090806;
   do not rerun it or blindly push all local migrations.
   For the Stripe-email change apply only
   `supabase/migrations/20261016134033_tuition_stripe_invitation.sql` before releasing
   its code. It only adds private request/consent/send state, preserving existing
   Checkout rows, RLS and invoker lease functions. It does not send or charge.
2. Set server-only `PORTAL_SUPABASE_URL` and `PORTAL_SUPABASE_SERVICE_KEY`.
   Add an independently generated `TUITION_ADMIN_KEY` of at least 32 characters.
   Keep test/preview state and secrets separate from production.
   The club restricted Stripe key needs Invoices and Invoice Items write, plus
   existing Customer/PaymentIntent/PaymentMethod read/write and schedule access.
   Verify the actual key against the first unsent draft before sending a live email.
3. Set `TUITION_ENABLED=true`, the correct `TUITION_SITE_URL`, the club's matching
   test Stripe key and `TUITION_ITEMS_JSON`, mapping each approved pool code to
   `{ "stripeProductId": "prod_...", "minimaxItemId": 123 }`. Stripe products must
   be in the same account/mode. Account binding is `acct_1TfaIdEJ7wtq3TXq`.
   Leave `TUITION_LIVE_ENABLED=false` until separately approved for live use.
   In Stripe [public details](https://dashboard.stripe.com/settings/public), set
   the terms URL to `https://www.apnea.si/pogoji` before requiring the Checkout
   consent checkbox (and the privacy URL to `https://www.apnea.si/zasebnost`).
   See [Stripe's Checkout agreement configuration](https://docs.stripe.com/payments/checkout/custom-components?platform=web&payment-ui=stripe-hosted).
4. The club webhook `/api/stripe/training-webhook` must also receive
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`,
   `invoice.payment_failed` and `invoice.payment_action_required`. Preserve the
   existing membership event configuration and signing secret.
5. Use the existing Minimax app login through the settings in `.env.example`.
   Use an external-application password from **Moj profil → Urejanje osnovnih
   podatkov → Gesla za dostop zunanjih aplikacij**, not a copied web-login password.
   Have the credential owner enter it securely. Never print it or paste it into chat.
   For local scripts, clear inherited `MINIMAX_*` variables and load `.env.local`
   using `loadEnvConfig(process.cwd(), true)` from `@next/env`, as documented in
   the hub's `samo-connections.md`. Do not source or manually parse this file.
6. Confirm the club's existing `MINIMAX_TRAINING_*` organisation, numbering,
   currency, invoice template, employee and Stripe payment mapping. Set the separate
   approved per-pool `minimaxItemId` values in `TUITION_ITEMS_JSON`, `MINIMAX_TUITION_VAT_RATE_ID`,
   `MINIMAX_TUITION_VAT_PERCENT=0` and `MINIMAX_TUITION_VAT_CLAUSE`.
   Samo confirmed `MINIMAX_TUITION_VAT_RATE_ID=29`, percent `0`, and this exact
   clause on every invoice: `DDV ni obračunan skladno z 12. točko 1. odstavka 42. člena ZDDV-1.`
   Set `MINIMAX_TUITION_DOCUMENT_NUMBERING_ID=62831` for the confirmed existing
   `Minimax - FURS - Apnea.si` series without changing membership settings.
   The local TRAINING numbering 62735 is stale; do not copy it to the server.
   This version requires the approved zero-VAT treatment and refuses other rates.
7. Set `MINIMAX_TUITION_POLICY=service_per_instalment` and enable
   `MINIMAX_TUITION_ENABLED=true` only for the approved live setup. Test-mode
   payments always skip real Minimax documents and Brevo, regardless of this flag.
8. Verify the first approved real accounting document and delivery after explicit
   live authorization, then release the rest of the reviewed rows. Native Stripe
   timing/stop behavior does not need another long simulation.

## Samo's computer

Use the authorized website checkout and Node with support for `--env-file-if-exists`
(Node 22.9 or newer), then `npm ci` once and `bash scripts/setup-repo.sh`.
Save only these operator settings in ignored `.env.tuition.local`:

```dotenv
TUITION_API_URL=https://www.apnea.si
TUITION_ADMIN_KEY=REPLACE_LOCALLY_WITH_OPERATOR_SECRET
```

Keep production API credentials on the server. Samo does not need Stripe MCP,
Stripe secret keys, Minimax passwords or the Supabase service key locally.
The operator secret allows tuition creation, status, integration recovery and
cancellation; protect and revoke it like an administrative credential.

## Verification

```sh
npm test
npx tsc --noEmit
npm run build
# Optional disposable local PostgreSQL runtime, never the production database:
PORTAL_PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node scripts/test-tuition-database.mjs
```

Tests cover replay handling, uncertain accounting/email outcomes, matching paid
amounts/mode/customer, finite schedule configuration and private SQL access/leases.
They do not create native Stripe objects, accounting records or messages.
