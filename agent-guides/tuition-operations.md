# Tuition payments: Samo and Katarina

Last updated: October 19, 2026

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


## First-payment recovery and Minimax draft verification (pending release)

Apply `supabase/migrations/20261016152641_tuition_atomic_first_payment.sql`
with the separately approved release, before deploying this code. It adds a
service-role-only, lease-checked RPC that commits first payment and the verified
invoice/Checkout consent pointer in one transaction. It leaves the existing
second-payment RPC and stored manifests intact. Do not reapply the older bridge
or invitation migrations under their repository timestamps if already hosted.

Cron and operator sync now recover legacy partial first-payment writes by
re-reading Stripe's paid invoice or Checkout and the original consent evidence.
They never infer consent from a payment row. Missing or mismatching evidence
remains in pending work with an error; accounting/email waits for reconciliation.
Cancellation is attempted before consent recovery. Replaying a verified payment
preserves the one-payment/one-finite-schedule constraints.

Every recovered or newly created Minimax invoice is validated before issuance:
payer, reference, currency, series, total, service dates, item, instalment text,
quantity/price, zero VAT/rate/clause and the paid-card mapping must match the
approved payload. Missing fields also hold the invoice. The same check runs again
after issuance, followed by the existing issued/fully-paid/PDF checks. Never
manually bypass a mismatch to send a receipt; reconcile the provider record first.
GET field schema: https://moj.minimax.si/SI/API/Help/Api/GET-api-orgs-organisationId-issuedinvoices-issuedInvoiceId

Local recovery regression (synthetic providers, disposable PostgreSQL):

```sh
PORTAL_PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node --import tsx scripts/tuition-recovery.test.mjs
```

This covers rollback between writes, invoice and Checkout legacy recovery, invalid
consent remaining pending after accounting is complete, replay without a duplicate
schedule, conflicting payments, expired leases and private RPC grants. The Minimax
HTTP test includes changed and missing draft fields and verifies zero issue calls
for every mismatch. No live charge, accounting document or message is a test fixture.

## Combined club invitation and daily bank import (local implementation, October 19)

Samo approved one email from `info@apnea.si`: the existing hosted Stripe invoice
collects two instalments, while an attached PDF supplies UPN details for the full
season. The first card instalment is collected when payment is confirmed, not on
the deadline. New combined invitations replace the initial Stripe email; they do
not call `invoices.sendInvoice`. The sender must equal `info@apnea.si`; replies use
that address. Existing submitted invitations (including prior pilots) must not be
converted or resent. Manual Minimax rows remain excluded by the hub operator.

This feature is off until the separately approved release. Apply the reviewed new migrations
`20261019095459_tuition_bank_reconciliation.sql` and
`20261019105859_tuition_email_delivery.sql`, then deploy the reviewed branch.
Do not bulk-push older migrations. Set `TUITION_BANK_ENABLED=true` only after a real
OTP statement has passed the read-only preview. OTP offers “XML sepa” and “XML SEPA
(ISO SEPA 2019)”; the actual namespaces remain unverified without a file. The local
parser supports camt.053.001.02 and .08 (UTF-8) and rejects payment-order pain.001,
DTD/entities and unknown formats. The bank statement must contain booked credits,
a stable bank transaction ID and the structured RF creditor reference.

For a general sample (no provider access):
`node --import tsx scripts/preview-combined-tuition.ts`.
For an approved real unsent plan, `tuition.ts preview-combined UUID --apply`
finalizes its Stripe invoice and saves its RF/full-season offer, but sends nothing.
It writes HTML/text/PDF into ignored `temp/tuition-previews/UUID/`; protect these as
participant records. Review them with Samo before sending. Use the hub's
`tuition-operator.mjs send approved.json --combined --apply` for sending, preserving
fresh source-row checks and original sent date. The ordinary `send` command remains
legacy Stripe-only and refuses any plan already prepared for combined sending.
Never bypass the wrapper for sending merely to avoid a Sheet failure.

After the release and validation, Samo saves each day's bank statement locally.
From this checkout:

```sh
node --env-file-if-exists=.env.tuition.local scripts/tuition-bank-import.mjs /private/path/statement.xml
# Read-only matching above. Apply the same file after checking its report:
node --env-file-if-exists=.env.tuition.local scripts/tuition-bank-import.mjs /private/path/statement.xml --apply
```

Python 3 must be available (`TUITION_PYTHON` can specify its path). Reports are
private 0600 JSON files in ignored `temp/bank-imports/`. Original statements remain
local, outside Git. Only normalized transaction evidence is submitted to the
existing authenticated tuition API. This is automation triggered by importing a
file, not an unattended bank connection or a scheduled download. No file means no
new bank reconciliation. Review `review` entries; rerun the same file for deferred
entries or after a provider outage. Successfully processed entries are skipped so
large files make progress across bounded requests.

Matching requires the club IBAN, exact full-season EUR amount, BOOK/CRDT,
non-reversal, unique structured reference and stable bank ID. No fuzzy name matching.
Partial payments, overpayments, unrecognized references, grouped entries, reversals
and changed evidence under an existing transaction ID go to review. The private
ledger deduplicates overlapping/repeated statements. A lease-checked SQL operation
records the credit and stops new local card collection atomically before contacting
Stripe. Recovery uses the existing cron/worker; already pending settlements remain
recoverable even if the feature flag is later disabled.

The Stripe adapter cancels finite schedules without prorations/final invoices,
voids only unpaid requests, then re-reads PaymentIntents. A paid or in-flight card
payment yields review and no refund. `cancelled_at` here stops the payment plan,
**not participation in training**; `bank_state` distinguishes it from withdrawal.
The member page hides the payment button. An unexpected provider object or failure
keeps bank state pending with a visible error; never tell the member collection is
closed until `cancellation_confirmed=true`. Late card webhooks recheck bank state
and cannot create another schedule. Daily importing cannot prevent a member from
paying by card between their bank transfer and its import; the email explains this.

Bank money is not recorded as a fake Stripe/card instalment or `paid_out_of_band`.
Bank entries have `accounting_state=review`; Minimax accounting/receipt delivery for
full-season bank payments is an explicit accounting follow-up, not automated here.
No automatic refund, receipt email, reminder or trainer-registration change occurs
on bank import. The API report and operator status are the review surface.

Verification: parser regression tests, isolated PostgreSQL grants/leases/rollback,
replay and evidence-conflict tests, native Stripe test-mode unpaid/paid cases with
replay, full application tests, TypeScript, build, local member page and message/PDF
preview. Native test customers were deleted and test products deactivated; no live
objects or messages were created. The PDF contains readable UPN fields and a vector UPN QR code. It does not claim
to be a preprinted bank form. QR encoding follows ZBS section 5: fixed V15, ECC M,
ISO 8859-2 with ECI 4, LF-delimited fields and a byte-length checksum. Unsupported
characters or payloads over 411 bytes block generation rather than corrupting or
truncating payer data. The generic sample encodes only a non-payable warning.
Project Nayuki v1.8.0 is vendored with its MIT license in `lib/vendor/`; production
does not call a remote QR service. `scripts/test-upn-pdf.mjs` creates synthetic PDFs
and `scripts/verify-upn-pdf.py` independently decodes them with ZXing, including
Slovenian diacritics, amount, IBAN, RF reference and checksum. Never send/pay these
synthetic verification PDFs. Real OTP mobile-bank scanning is not yet verified.
Actual OTP export validation and live sender/delivery remain release acceptance.


## Brevo delivery tracking and internal test (local, October 19)

Samo chose to retain Brevo Transactional and requested delivery tracking plus a
prepared final-message test before member sending. This implementation covers new
combined tuition invitations and explicitly approved internal tests. Legacy Stripe
invitations, membership messages and Minimax PDF emails keep their existing flows;
no historical delivery status is invented. `Poslano` still means provider submission,
not delivery/read confirmation; no additional Sheet columns are created here.

`sendTrackedTuitionEmail` inserts a private, unique send record **before** contacting
Brevo. The response messageId is normalized and saved, and an opaque `tuition-email:UUID`
tag correlates early callbacks. A duplicate ID/plan or uncertain response cannot
send again. A callback can recover the provider ID after a lost HTTP response, but
it never silently marks an uncertain invitation safe to resend or rewrites the
original invitation date. An operator reconciles that evidence first.

The migration adds `tuition_email_deliveries` and append-only `tuition_email_events`,
RLS with no public policies, explicit service-role grants (after revoking Supabase's
default ALL grants, including DELETE/TRUNCATE) and invoker RPCs with empty search
paths. It stores normalized recipient, message ID, event type/time and a bounded
provider reason, never message bodies, payment links or raw webhook payloads.
Event identity hashes message ID, recipient, event type and occurrence time; Brevo's
webhook `id` is not treated as a unique event ID. Repeated deliveries are harmless.
Mismatched recipients/message IDs fail closed. Account mail outside this flow is
ignored. Opens/clicks are ignored, not interpreted as evidence that a person read it.

`POST /api/brevo/tuition-webhook` requires a separate, random 32+ character
`BREVO_TUITION_WEBHOOK_SECRET` in the Authorization bearer header. Configure this
header in Brevo's webhook settings; do not put secrets in the URL, reuse the operator
key, or disable authentication. Use the canonical www HTTPS URL to avoid redirects.
Use non-batched delivery (`batched=false`). Choose transactional events `request`, `delivered`, `deferred`, `softBounce`,
`hardBounce`, `blocked`, `invalid`, `spam`, `unsubscribed` (and error if the account UI
supports it). Callback event names use `soft_bounce`, `hard_bounce`, `invalid_email`.
Single events and batches of up to 50 are accepted, with a streamed 128 KB byte limit.
Database failures return 503 for retry; invalid input returns 400; invalid auth 401.

Operator `tuition.ts status UUID` includes `emailDelivery` with provider ID, submission
state, delivery status/time, failure reason, history and `needs_review`. Internal
tests use authenticated `GET /api/tuition/email-delivery?id=UUID`. Delayed request or
soft-bounce events cannot erase delivery; permanent failures/complaints stay visible.
An uncertain submission or missing delivery evidence after 24 hours requires review.
No webhook sends reminders, retries an email, changes payments, or writes the Sheet.
`delivered` means the recipient server accepted it, not inbox placement or reading.
This is a pull-based status report; automatic staff alerts are not implemented.

### Release and internal test steps

1. Obtain the normal push/PR, migration and production-release approvals. Neither
   this source migration nor an internal-test draft is a production change.
2. Apply the reviewed migration, deploy the route, securely set the dedicated webhook
   secret and configure the authenticated Brevo webhook. The provider settings and
   secrets are not configured by this local implementation.
3. Set `TUITION_EMAIL_TEST_ENABLED=true` and `TUITION_EMAIL_TEST_RECIPIENTS` to the exact
   approved internal addresses, comma-separated. Keep `TUITION_EMAIL_TRACKING_READY=false`
   during verification. Internal tests do not require enabling bank collection.
4. Prepare each test locally (no env/database/provider access):
   `node --import tsx scripts/tuition-email-test.ts prepare approved-address@example.com`.
   Review the generated HTML/text/UPN in ignored `temp/tuition-email-tests/UUID/`.
   Files are private; preserve test.json and its ID through all retries/status checks.
5. Only after explicit sending approval, use the existing local operator settings:
   `node --import tsx --env-file-if-exists=.env.tuition.local scripts/tuition-email-test.ts send /private/path/test.json --apply`.
   It uses `TUITION_API_URL` and `TUITION_ADMIN_KEY`, exact server-side allowlisting,
   the actual sender/reply-to and the shared final template. Subject starts with
   `[TEST – NI ZA PLAČILO]`. Synthetic payer, placeholder Stripe link/IBAN/reference
   and a non-payable QR prevent accidental payment. No Stripe/Minimax/Sheet action.
6. Read status with the same command replacing `send` with `status` and omitting
   `--apply`. Check the message in the actual mailbox: inbox/spam/promotions, SPF,
   DKIM, DMARC, mobile/desktop layout, readable PDF, sample QR warning and reply-to.
   A successful API response alone is not a passed delivery test. Mailbox replies
   are a separate sending action; don't send them without authorization.
7. Resolve rejects, missing callbacks or uncertainty. Disable internal-test sending
   after verification. Set `TUITION_EMAIL_TRACKING_READY=true` only after the real
   end-to-end delivery check passes. Combined member sending requires this flag plus
   the configured secret, the bank readiness gate and normal recipient approval.

On an uncertain submission, inspect the same delivery ID before any retry. The
server logs `Tuition email submission failed` with only the failure stage,
provider HTTP status and a bounded provider code; raw errors, credentials,
recipients and message content are excluded. A successful local-key preflight
does not verify Vercel's separate Production Secret. `vercel env run` can fall
back to local values for unpullable Secrets; do not mistake that for a Production
credential test. Keep tracking readiness disabled until actual delivery passes.

Brevo requires the idempotency header to be a UUID. Tracked tuition sends use
the immutable delivery UUID directly; the `tuition-email:` prefix belongs only
to the correlation tag. Production and a native API reproduction rejected the
old 50-character prefixed key with HTTP 400 `out_of_range` ("Idempotency key
exceeds char limit"). Do not unlock earlier uncertain records or automatically
resend them after this fix. Explicitly approved separate internal diagnostics
remain distinct records. [Provider contract](https://developers.brevo.com/docs/heterogenous-versions-batch-emails).

The prepared user-selected test recipients cover Gmail and the club-domain mailbox;
no Outlook address was supplied. On October 19, an approved UI test of template 299
was submitted to those three addresses and Samo confirmed receipt on at least one.
That UI test bypassed this application's send/evidence flow and does not verify the
live callback. The local API key was subsequently reactivated with Samo's explicit
approval; a read-only sender check passed. A sample checks layout/delivery, not a
real payment or banking QR.

Release preflight, October 19: hosted `apnea-trenerji` has neither delivery table;
Brevo's transactional webhook list returned `document_not_found`. No production
setup was changed by this preflight. The SQL test now reproduces the hosted ALL
default table grants and confirms service-role DELETE/UPDATE/TRUNCATE of event
history are rejected. All 105 application tests, the isolated SQL test, focused
lint, TypeScript/build and localhost route checks passed. Localhost used synthetic
credentials and disabled sending: missing auth 401, malformed payload 400, oversized
payload 413, ignored open 200, and disabled internal send 409. The real callback
check must still run after the separately approved deployment/configuration.

Verified documentation: [send API](https://developers.brevo.com/docs/send-a-transactional-email),
[events](https://developers.brevo.com/docs/transactional-webhooks),
[webhook authentication/configuration](https://developers.brevo.com/reference/create-webhook).

October 19 release follow-up: the combined invitation now supports both one and
two approved instalments and shows the actual service period in the email/PDF.
The real OTP camt.053.001.08 export parsed successfully (14 entries); matching
preview and production activation still require the deployed API. Samo authorized
the production release and a four-person pilot. Use registration-form addresses
as the source; if absent, Samo permits omission (current schema still requires
address fields, so do not fabricate placeholders or bypass validation).

### October 20 email copy and inline UPN QR

The combined template now uses Samo's October 20 copy and `ŠD Apnea.Si`
signature. The subject is `Vadnina 2026/27 – [participant name]`, using the
participant rather than the payer; safe samples use `Vzorec Član`.
Two-instalment plans offer card payment first and a full-obligation
UPN second. One-instalment plans retain truthful one-payment wording; editing
copy never adds an instalment to a plan. Sender, reply-to, delivery callbacks,
original submission date and replay locks are unchanged.

Brevo does not support attachment CID images for transactional messages
([provider clarification](https://community.brevo.com/t/does-transactional-email-support-embedded-image/6665)).
The HTML therefore loads a PNG from `/api/tuition/upn-qr/[token]`, beside the bank
details on desktop and below them on mobile. It uses the PDF's exact QR matrix
(UPNQR, ISO 8859-2/ECI 4, V15/M) with a four-module quiet zone. The PDF remains
attached for clients that block images; no external QR service receives payer data.

The image URL is a bearer capability: anyone with the complete URL can see the
payer details encoded in that QR. Treat it as private, like the attached PDF;
never put a real URL into public logs, screenshots or issue bodies. It contains
only plan ID, manifest hash, expiry and a domain-separated HMAC, not plaintext
payer/bank details. Signing reuses the existing server-only `TUITION_ADMIN_KEY`;
rotation invalidates image URLs (PDF attachments are unaffected). URLs expire 30
days after the first service period ends. Signature and expiry are checked before
storage access; the server then checks the exact manifest and saved club bank
offer. Missing/invalid capabilities return 404; cancelled, card-paid or bank-held
plans return 410. Reads never send email or change any record. Responses use
private/no-store, noindex and no-referrer headers. Email-provider caches and
already downloaded images/PDFs cannot be revoked by this endpoint.

`/api/tuition/upn-qr/sample` serves only the non-payable sample without database
access. Offline and operator previews embed the PNG in their saved HTML, while
outgoing HTML uses HTTPS. Verify the actual received email image in an explicitly
approved internal send after deployment; a localhost image or provider-delivered
callback alone does not prove display in a recipient's email client.
