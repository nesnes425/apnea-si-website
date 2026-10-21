# Read-only tuition batch preflight

Local implementation, October 21, 2026. Deployment and production use require the
normal website release approval. This endpoint creates no plan, customer, invoice,
payment, email, database row or provider setting. Minimax's existing OAuth token
exchange is the only upstream POST; every business-data request is a GET.

`POST /api/tuition/batch-preflight` uses the existing `TUITION_ADMIN_KEY` Bearer
authentication. Send private JSON directly to the authenticated endpoint; do not
put manifests or credentials in URLs, public logs or issue bodies. Responses are
private/no-store and contain IDs/references rather than payer identity/address.

Request: `{ plans: TuitionPlan[], bankCoverage?: { sourceRef, checkedAt,
coveredThrough } }`. Supply complete, already approved `planSchema` manifests in
live mode, one to ten per request, with unique plan and obligation IDs. The
streamed request limit is 60,000 bytes. Bank dates are ISO datetime/date strings.
`sourceRef` identifies the real statement or bank export reviewed by the operator;
it must not contain a payer name or email. Coverage must have been checked within
24 hours, cover at least yesterday in Europe/Ljubljana and contain no future dates. This is attributed
operator evidence, not independently verified bank access. Never generate such a
reference or freshness timestamp merely to pass preflight. If actual coverage is
missing/stale, update the bank evidence through the existing authorized workflow.

Response: `{ version: 1, checkedAt, results: [{ planId, obligationId, manifestHash,
planDigest, disposition, checks: { registry, stripe, minimax, bank } }] }`.
`manifestHash` is the existing parsed-manifest `fingerprint`; `planDigest` is
SHA256 of JSON with all object keys recursively sorted (the hub runner's digest).
Each check has `status: clear|match|conflict|incomplete`, `references`, `reasons`
and `checkedAt`. Bank coverage, when supplied, is returned with
`basis: operator_statement_coverage`. Even a `clear` bank check explicitly records
that register absence does not cover unimported money. No response authorizes a
write, and preflight never reserves or locks an obligation.

`ready` permits the runner to proceed to its separately authorized creation step;
`resume` refers to an exact existing manifest; `skip_paid` and `skip_submitted`
prevent duplicate work; `blocked` requires resolving the listed conflict or
coverage problem. Paid/submitted exact manifests are safe skips even when another
provider is unavailable. Existing cancellation, errors, bank review/pending entries
or uncertain/sending delivery states block resuming. Submitted includes the durable
club email lock. Read the existing plan-status endpoint after sending; do not use
provider absence as evidence that an uncertain send did not happen.

The collector uses existing server credentials and libraries. Registry queries
include exact plan IDs, source obligations and case-insensitive exact payer email;
pagination also covers payment, bank and delivery references. Another ID for the
same obligation, a changed exact manifest, or another overlapping obligation for
the same participant/payer blocks. A distinct participant sharing a payer is not
automatically a duplicate.

Stripe verifies the live club account `acct_1TfaIdEJ7wtq3TXq`, then fully paginates
customer, invoice, PaymentIntent and Charge lists without eventually consistent Search.
Invoices include fully paginated line items. Guest payments are matched through
the existing exact metadata/receipt/expanded-charge billing email. Only explicit
membership metadata/service evidence excludes membership-only records; a tuition
or mixed invoice never gains an exclusion merely because it is paid. Existing
unpaid tuition invoices match only their exact stored invoice ID, plan metadata
and customer. Extra invoices or paid invoices without registered payment evidence
block pending reconciliation. Legacy standalone Charges and charges whose billing
email is absent from the intent are included without double-counting seen intents.

Minimax verifies club organisation `241557`, fully paginates customers and each
matching payer's regular (`R`) invoice list, and reads actual invoice details.
The customer-list API has no email field: matching uses the exact stable hashed
payer code or normalized exact payer name; same-name candidates are deliberately
included. Tuition item IDs/names/descriptions, membership item identity and actual
service dates decide relevance. Missing invoice rows, missing page metadata,
unclassified overlapping records or missing service dates never produce a false
absence. Non-overlapping known service periods are excluded. This does not inspect
proformas, reconcile accounting or establish a person's identity from email alone.

Every source is bounded to 20 pages of 100 records. Minimax invoice details use
groups of at most five reads. A shared 43-second budget stops new requests; existing
provider timeouts finish below the route's 60-second limit. Page truncation,
repeated cursors, changed totals, timeout, unsupported response shape, missing
runtime credentials or read errors return incomplete/blocked instead of clear.
Larger histories need a separately reviewed continuation design; never raise a
clear result by silently dropping old pages. Keep the response bound to its exact
manifest digest/obligation and fresh check time immediately before a write, then
re-read existing plan status after each action. Database/provider state may change
between this read and that action; existing durable/idempotency guards remain
necessary.

Verification: 20 focused synthetic tests cover exact resume, paid/submitted
skips, conflicts, membership exclusions, bank freshness, failed reads, pagination
and route authentication/body limits. TypeScript and focused ESLint pass. A
separate live read verified Minimax identity and complete pagination of all 354
customers with a synthetic unmatched payer; Stripe plugin account discovery
verified the live club. The local checkout lacks the Production live Stripe key,
Supabase service key and tuition-item environment mapping. No credential was added
or changed; the complete hosted runtime collector remains to be checked after an
approved release. No real plan or message was created by these checks.
