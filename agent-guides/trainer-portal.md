# Trainer portal pilot

Last updated: October 7, 2026

## Status and scope

Preview candidate on `codex/trenerji-pilot`; production merge is not approved.

The verified import status at the end of this guide supersedes the dated setup
notes below. The scope is now 32 connected groups, not only the initial pilot. Public registration,
Stripe, Minimax, existing Sanity data and existing Brevo lists are unchanged.

Routes:
- `/trenerji`: invited users only; assigned sessions, attendance, guest lookup,
  comments, three program levels (current published date interval only).
- `/trenerji/pregled`: admin-only attendance matrix and regular/substitute hours.

One pilot group: Ilirija Tuesday 21:00–22:00, Daša Tičar. Samo and Katarina
are the only intended administrators. Do not infer access from an email domain.
Auth user IDs must be explicitly entered in `portal_staff` with approved roles.

The user confirmed this roster source: Google Sheet `1f5mlpxe0fmmqtn7VOqC5l6yXtXs2gl7C8BBScZmsUtI`,
tab `Skupine`, Tuesday columns Q:X, Ilirija block beginning at row 91.
October 6 read found 13 names across two lanes; re-read the live block before import.
The smaller `Pregled skupin in prijavljenih` is NOT the confirmed source.
Do not commit personal data. Do not copy real members into the local demo fixture.

## Local verification

Set `PORTAL_LOCAL_DEMO=true` only when running `next dev` on loopback.
The demo requires NODE_ENV=development and refuses Vercel. It has synthetic test
identities, 13 roster members, one guest and three test dates. It writes only to
`.portal-local/demo.json` (gitignored); no mail goes out. This storage is single-process
QA storage and is NOT a deployment backend. Real mode never falls back to it.

Local commands with the project's normal Node/package-manager installation:

```sh
PORTAL_LOCAL_DEMO=true npm run dev -- --hostname 127.0.0.1 --port 3100
node --import tsx --test lib/portal/model.test.ts
npx tsc --noEmit
npx eslint 'app/(portal)' lib/portal lib/brevo/portal-comment.ts
npm run build
```

In this checkout tsx is only available in its pnpm package directory. The verified
command uses `--import ./node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/loader.mjs`.

Database permission tests run against an isolated PGlite PostgreSQL emulator, not
production. Install `@electric-sql/pglite` in a disposable test directory and run:

```sh
PORTAL_PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-portal-database.mjs
```

Tests cover anonymous reads, cross-coach reads/writes, revoked users, current-only
programs, restricted assignment, missing/duplicate attendance, stale versions,
closed-session correction, audit records and exactly-one outbox claim.
These do not replace the real Supabase Auth/PostgREST/Brevo integration test.

## Connected backend status (October 7, 2026)

Dedicated project `apnea-trenerji` (`jqgpvfxyzpvncuiukyxv`), organization
Apnea-Hub, Frankfurt, Free plan. Schema migration applied successfully October 6.
All seven tables have RLS and no anonymous grants. Privileged implementations live
in `portal_private`; exposed RPC wrappers are security invoker. Local role tests pass.
Live REST checks on members and snapshot return 401 without a user session.
Security advisor reports only six informational RLS-without-policy notices: intentional
closed tables, accessed exclusively by explicitly authorized RPCs.

Local gitignored `.env.local` contains project URL and publishable key. Email and local
demo flags are false (an already-running dev process may override the demo flag).
No service key or Vercel settings configured. No website push/deploy performed.

Public signup disabled October 7; anonymous sign-in remains disabled; email verification
remains required. Three Auth users created without confirmation emails or auto-confirm:
Samo and Katarina mapped to admin, Daša to trainer. Random bootstrap passwords were
not retained; portal login uses OTP. Users have not completed email verification.

Brevo custom SMTP is configured and persisted (verified by reload October 7).
Host smtp-relay.brevo.com, port 587, existing sender info@apnea.si / Apnea Slovenija.
Separate key `Apnea trenerji – Supabase OTP` stored only in Supabase; expires October
7, 2027 and after 90 days of inactivity per Brevo. An earlier unused key was deleted
with explicit user approval and replaced. Its replacement is the only active portal key.
Magic-link/OTP and confirm-signup templates now contain Slovenian copy and {{ .Token }}.
No emails sent yet; real OTP login and delivery verification still required.
No real members or seasonal sessions imported yet.

## Remaining setup checklist

1. Confirm an Apnea.si-owned Supabase project and appropriate region, costs,
   retention, backups and owner access before creating or changing cloud resources.
2. Review/apply `supabase/migrations/202610060001_trainer_portal.sql` to that project.
   All tables have RLS. Authenticated users can read their own active staff row;
   other data is accessed through checked SQL functions. No anonymous portal access.
3. Disable public signup. Create only the approved pilot Auth users. Add matching
   `portal_staff` UUIDs. Users must verify their own addresses. No welcome/test
   emails to Daša without a reviewed pilot invitation.
4. Configure Supabase custom SMTP with Brevo and the approved sender. Set the
   email template to show the OTP (`{{ .Token }}`), not a magic-link-only template.
   No password entry is needed. The app uses a 6–8 digit OTP, HTTP-only access and refresh
   cookies, SameSite=strict, Secure in production. See remembered-device policy below.
   Supabase handles OTP expiry and rate limits. Test real sign-in and expired codes.
5. Configure server environment values in `.env.local` and, after approval,
   Vercel Preview/Production. Never paste values in chat or commit them:
   - `PORTAL_SUPABASE_URL`
   - `PORTAL_SUPABASE_ANON_KEY` (publishable key or legacy anon JWT)
   - `PORTAL_SUPABASE_SERVICE_KEY` (secret key or legacy service_role JWT; mail only)
   - `PORTAL_EMAIL_ENABLED=false` until an approved internal delivery test
   - Existing `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
   Never set `PORTAL_LOCAL_DEMO` in deployed environments.
6. Import the confirmed roster, explicit staff identities, group and confirmed
   seasonal session dates using reviewed database inserts. Preserve stable member
   UUIDs. Current pilot schema supports one home group per member; do not expand to
   multi-group memberships or move/delete roster rows without adding dated
   enrolments first. Session entries preserve the names at finalization.
   Import is NOT automated or performed yet. Do not treat the demo dates as a season calendar.
7. Publish reviewed program text into `portal_programs`: one row per level/date
   interval, `published=true` only after Samo approves. Do not overlap published
   intervals for a level. Content renders as plain text; no raw HTML injection.
   No training content has been published by this implementation.
8. Test three real roles plus logged-out access through PostgREST and browser,
   email OTP, membership search, refresh persistence and concurrent writes.
   Verify Brevo delivery logs, not only API acceptance. Verify private table
   access and restore a backup before real attendance begins.
9. Local verification, user push approval, PR + Vercel preview check, then explicit
   production merge approval remain required. Do not push directly to main.

## Finalization and comments

Only the assigned active coach or an admin can finalize a past/current session.
Cancelled/future sessions cannot be finalized. An admin alone can correct a closed
session; the original and changed values are retained in `portal_audit`.
Assignment changes are admin-only, only before finalization, and retain the original
coach for reporting. Hours use the scheduled start/end, with no editable duration.

Comment and outbox intent are committed in the same transaction as attendance.
Recipient is fixed to `info@apnea.si`; subject uses actual coach, group label, date.
No comment means no mail. Unchanged comments on corrections do not enqueue again.
The server attempts delivery after save only when explicitly enabled. Brevo acceptance
is displayed as acceptance, not proof of delivery. Outbox claiming prevents concurrent
sends. API request includes an idempotency key. Network/server ambiguity is marked
`uncertain`; do not automatically resend it. Reconcile with Brevo first. A process
crash after claim may leave `sending`; operators must reconcile these as well.

There is no background mail worker yet. Pending/failed/uncertain deliveries must be
reviewed by operators and recovered deliberately; do not silently call the whole flow
production-ready. Email failure must not erase successful attendance.

## Deferred beyond first pilot

- Dated enrolments/multiple regular groups, routine member transfers and automatic
  imports; full season calendar and staff substitutions outside the initial group.
- Automated repeated-absence follow-up, hours exports and payroll approval.
- Program publishing UI/scheduler and weekly notifications.
- Background mail queue with reconciliation and delivery callbacks.
- Multi-trainer sessions (the pilot has one actual coach).

## SMTP setup resolution — October 7, 2026

User explicitly approved key creation and subsequently deletion/replacement of the
unused first key. Supabase form initially did not save; after dismissing its overlapping
announcement banner, save succeeded and reload confirmed enabled SMTP with a stored
password. Replacement key display closed only after persistence was verified. Secret
not retained in repo or chat. Both Slovenian OTP templates saved successfully.
Screenshots of the final state timed out; DOM persistence and success toast verified.
User mentioned an upgrade, but service/plan was not specified or reverified; do not
infer a new price from that statement. No changes to subscription made by the agent.

## Trainer usability review — October 7, 2026

Session selector defaults to the nearest assigned session by date and time in Europe/Ljubljana.
An ongoing session has distance zero; otherwise distance is measured to its start/end.
Cancelled sessions sort last. Manual selection is retained during edits. Attendance exposes only
present/absent buttons; an untouched input remains unset until explicitly completed.
Members and makeup guests sort by first-name display string using Slovenian collation.
Group level sets the initial program and resets on session selection (beginner/Začetni,
performance/Performance, otherwise advanced). Makeup expander is a 56px touch target;
mobile attendance controls are 48px high and full-row. Verified at 320px and 390px
without page overflow; typecheck and focused lint passed.

## Personal greeting

Remote migration `staff_welcome` adds nullable `portal_staff.welcome` with allowed
values Dobrodošla / Dobrodošel. Set explicitly when provisioning a trainer; do not
infer from names. Pilot profiles configured. Missing setting uses neutral Dobrodošli.
The heading displays the first name and “hvala za tvoj trud!”. The exact applied migration is preserved as
`20261007094447_staff_welcome.sql`; no new database change is required.

## Real pilot preparation — October 7, 2026

Re-read authoritative roster Q90:X106: 12 names now, not the earlier 13. Imported
only names into the private database group Ilirija · torek 21–22, season 2026/27,
canonical level advanced. Source sheet unchanged; no member emails imported.
First occurrence October 6, 21:00–22:00 assigned to Daša with empty attendance.
Season calendar shows LJ October 5 through June 14. Asked Samo to confirm exclusion
of December 29 and April 27 before generating the remaining Tuesday occurrences.
Local server 3100 now runs with PORTAL_LOCAL_DEMO=false and PORTAL_EMAIL_ENABLED=false.
Real Auth test pending user entry; Samo's email is confirmed in Auth. Login action
now falls back to signup confirmation resend on OTP 422 for pre-created unverified
accounts, preserving neutral responses and disabled public registration. TS/lint passed.
No programs published and comment email delivery remains disabled.

## Local preview recovery

Turbopack crashed during CSS compilation with missing pooled Node process (ENOENT).
Adding bundled Node to PATH did not recover it. Use `next dev --webpack --hostname
127.0.0.1 --port 3100` with bundled Node bin on PATH for this checkout. Real-mode
login page and request-code Server Action verified in browser after restart; form
advances to code entry. User must enter newest email code; delivery is not inferred
from the intentionally neutral UI response.


## Remembered devices — October 7, 2026

Implemented and applied `20261007101058_portal_remembered_sessions.sql` to the
pilot project. Checkbox is opt-in. Trainers: 30 days inactivity, absolute end of
season (June 14, 2027 inclusive, Europe/Ljubljana). Administrators: 20 days
inactivity, absolute 30 days from login. Without remembering: at most one hour,
browser-session cookies. Every new season requires a deliberate policy update.

Private device registry is tied to live auth.sessions and active portal_staff.
Every exposed portal data RPC enforces the deadline; refreshing an Auth token
cannot extend it. Logout revokes the portal session before removing cookies.
To revoke a lost device, set its private device_sessions.revoked_at; to remove
all portal access, disable the staff profile. No self-service device list yet.
Old sessions need one fresh OTP login to register under the new policy.

Next.js proxy rotates refresh tokens on requests; no background refresh timer.
Tests cover 30/20-day boundaries, absolute limits, revocation, role changes,
anonymous access, browser-cookie lifetime, refresh rotation and transient outages.
PGlite session tests and eight Node tests passed; typecheck and focused lint passed.
Real OTP-to-refresh integration still needs the user's next login.

Security advisor: eight informational RLS-without-policy findings are deliberate
RPC-only/private tables. One warning remains about disabled leaked-password
protection; portal uses OTP, but this Auth setting merits review before launch.
Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
No deployment or additional paid service introduced for this feature.


## Dated membership and full-source import — October 7, 2026

Applied `20261007103020_portal_dated_memberships.sql`. Members are permanent;
portal_memberships holds inclusive valid_from/valid_until and supports multiple groups.
The original 12 pilot memberships were preserved, starting at the existing pilot date.
The legacy member.group_id is retained for compatibility only; use memberships for
attendance, authorization, makeup search and history. Closed sessions use their
saved roster and names, even after enrolments end. No absence is inferred outside
an enrolment interval. Retired members remain in the admin season matrix.

Read source Skupine across five weekday blocks through row 1048: 33 slots,
314 enrolments, 301 distinct normalized name/email keys. Samo explicitly approved the baseline 2026-10-05 and daily 15:00 Europe/Ljubljana
sync after the initial auto-review rejection. Re-read all five source blocks and
completed the first import: 33 groups, 301 members, 314 enrolments. All valid_from
values, including the 12 legacy pilot enrolments, are 2026-10-05. One sync run committed.
The source was not modified. A source note “november - marec” in the static roster
is excluded explicitly; unknown non-member rows cause a review error.

lib/portal/roster-source.mjs validates complete group layout and hashes normalized
name+email into private identifiers; email is not sent to the portal database.
Name/email corrections require operator identity reconciliation; hashes are NOT
anonymization and are not exposed by the snapshot. Same-name ambiguity during
pilot matching blocks import. Row numbers are not identity keys.

scripts/sync-portal-roster.mjs reads the fixed sheet via a read-only Google service
account and sends the complete validated snapshot through the service-only RPC.
Dry-run by default, --apply writes. Required env (not configured yet):
PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON, PORTAL_SUPABASE_URL,
PORTAL_SUPABASE_SERVICE_KEY. PORTAL_INITIAL_MEMBERSHIP_DATE is required for first
import only. Never expose these credentials to clients or paste them in chat.
Grant the Google account read access only to the source sheet. Scheduling is NOT
active; approved schedule is daily at 15:00 Europe/Ljubljana and requires a trusted hosted
runner after setup. Account for daylight saving (13:00 UTC summer / 14:00 UTC winter).
Both Google service-account credentials and the Supabase server key were checked
and are missing locally. Do not claim the schedule is activated. Daily polling uses
the date a change is observed, so edits after 15:00 appear the following day.
Do not schedule this through a conversational agent heartbeat as an application job.

Subsequent additions start on Monday of the observed week. Removal ends membership
on the observed local date inclusive; it never deletes a person or attendance.
Polling cannot recover exact edit timestamps or edits made and undone between runs.
A reviewed operator correction is necessary for historical effective dates; no
self-service correction form exists yet. Finalized rosters remain frozen.
Rejoining creates a new interval (same-day undo reopens that day's ended interval).
Missing/renamed groups, stale snapshots, missing identities, duplicates or removal
of five or more members / more than 25% of a group reject the entire transaction.
New group layout requires reviewed manifest update. Failed reads never imply removals.

Verification: isolated database tests cover dated schema, closed-session corrections,
service-only import, replay rejection, repeat-import idempotency, transfers and mass
removal blocking. Existing Auth session tests pass with the new migration. Nine
Node tests and TypeScript validation pass. Real full import and aggregate counts verified after date approval. Automatic
sync remains inactive pending dedicated credentials and deployment.
All-season session generation, additional trainer provisioning and multi-coach
allocation remain separate unfinished setup; no trainer invitation was sent.

## Remaining session calendar — October 7, 2026

Read the season calendar 13Wv_SjC5uoYBeIYZ3jUAfN0YU7VrFQj8wvGHINumgSw,
tab 2026/27 Koledar, A1:AG48. Regional starts: LJ/RAD Oct5, KR Oct6,
VEL/KP Oct12, NM Oct13, NG Oct14. Ends: KP May10, RAD May17, NM May25,
NG May26, VEL May31, KR June9, LJ June14. Static source note is November–March.
Pending user clarification of holiday spans Dec24–Jan1 and Apr26–30 and whether
both named coaches at six dual-coach slots work/count one hour each.

Attempted to expand the three Daša slots through June14 while leaving uncertain
holiday spans out. Auto-review rejected that bulk insert due to unconfirmed
calendar exclusions and coach attribution. NO sessions were added: only the single
pilot occurrence remains. No other coaches provisioned and no invitations sent.
Do not report the attempted insert as successful. Obtain explicit date/assignment
confirmation before retrying; the two clarification questions remain pending.

Auto-review rejected dropping portal_staff_id_fkey to create roster-only staff;
rejected migration was NOT applied and its local file removed. Do not bypass this
rejection. Preserve the Auth link; provision verified coach accounts through the
supported Auth API when server credentials and approved identities are available,
or prepare a separately reviewed design. Only Daša currently has a trainer account.


## Shared coaching confirmed — October 7, 2026

Samo confirmed both listed coaches jointly lead the same session, see the same
members, and each earn the scheduled hour. Applied migration
20261007110943_portal_shared_coaching.sql: additional coach table retains staff/Auth
foreign keys and is protected with RLS and no direct client grants. Snapshot and
write authorization include both actual coaches. Shared version locking and one
session row prevent duplicate attendance/mail. Snapshot includes coach_ids and
regular_coach_ids; both coaches receive hours only after the session is closed.
Primary/additional substitution is admin-only, versioned and audited; duplicate
actual coaches are rejected. Replaced coaches lose access unless independently
assigned elsewhere. Existing single-coach sessions remain compatible.

Tests: isolated SQL proves shared reads/writes, unauthorized read protection,
secondary substitution, duplicate rejection, version conflicts and single outbox.
Ten Node tests, TypeScript and focused lint pass. No real second-coach assignments
yet: still provisioning the remaining Auth accounts before calendar import.

Samo supplied Maj Brlek and Luka Geršak contacts in this turn. Matevž Dolenc email
still missing; question pending. Ana Šalamun has no confirmed slot and must not be
assigned from the contact list alone. An existing Supabase default secret key is
available in Dashboard. Auto-review blocked copying it without explicit approval;
permission question pending. Key has NOT been copied, saved or used. No invitations
sent. Never bypass the credential approval block or drop the staff/Auth foreign key.

Samo subsequently deferred statics: do not create/invite Matevž or import static
occurrences yet. Revisit his roster when statics start. Calendar manifest marks
that slot enabled_for_import=false; remaining32 are ready for account linking.


## Trainer-initiated substitution — October 7, 2026

User authorized assigned coaches as well as Samo/Katarina to choose replacements.
Applied 20261007112008_portal_trainer_substitution.sql: an active actual assigned
coach (either position) or admin can replace a coach on a planned session only.
Cross-group callers and replaced coaches without another assignment are rejected;
version checks, audit and original regular coach identities are retained. Closed
and cancelled sessions cannot be reassigned. UI offers a searchable all-active-staff
list, with no own-group requirement, and selection of which coach is replaced in
a shared session. Ana Šalamun is explicitly authorized as a substitute-only trainer,
but her Auth/profile provisioning remains pending the existing secret-key approval.
No invitation or account creation occurred in this turn.

Admin report now filters completed substitutions and displays date, group, actual
coach and the regular coach replaced. Hours count only closed sessions and use the
original assignment to distinguish regular from substitute hours. Tested trainer
assignment to a coach with no prior group, unrelated caller rejection, removed
coach access, duplicate prevention, closed-session lock and concurrency/versioning.
TypeScript and focused lint passed. This supersedes the older admin-only assignment
rule above. Not pushed or deployed to the public website.

## Substitute placement and Ana activation — October 7, 2026

Moved the replacement-coach expander directly below the member-makeup expander and
above the comment. TypeScript passed; browser visual verification was unavailable
because the local tab timed out.

After Samo explicitly approved Ana Šalamun, created her Auth account through the
Dashboard Create User form (which explicitly sends no confirmation email), with
a discarded random bootstrap password and auto-confirm disabled. Added the matching
active trainer profile with feminine greeting; retained the staff/Auth foreign key.
Database readback confirms no primary or additional session assignments. She is
eligible in the all-active replacement search and gains roster access only when
assigned. Email ownership must be verified at first OTP login. No invitation sent.
This supersedes Ana's pending-provisioning note above. No secret key was copied or
saved. The remaining calendar/account import is still pending. No push or deploy.

Katarina is excluded from replacement-coach choices in both the trainer form and
admin assignment controls, using her stable staff ID. Her active admin role and
report visibility remain unchanged.

## Verified import status — October 7, 2026

Supabase readback: 18 active trainer profiles and 2 admins. All 32 enabled seasonal
groups linked, 1,043 occurrences, 193 occurrences with two regular coaches across
six groups. Only statics has no calendar (explicitly deferred by Samo). Ana Šalamun
is substitute-only. Maja K. Vesel / Maja Kac identity was explicitly confirmed by
Samo, and both Koper groups are linked to her verified contact. All newly provisioned
Auth accounts were created via Dashboard without any email or auto-confirm, using
random bootstrap passwords that were discarded; first OTP must verify ownership.

Import used source_key/group + date/start uniqueness, preserved existing attendance,
versions and substitutions, and rejected existing calendar/regular-coach conflicts.
Repeated passes were idempotent. Exact cancellation dates and local start/end dates
come from season-2026-27.json. All seven October 7 occurrences are assigned. Their
rosters contain 20, 5, 9, 16, 15, 9 and 0 members respectively. Live source read
Skupine!AF92:AL107 confirms Tivoli Wednesday 21–22 has no members; Samo clarification
pending. Do not copy members from the previous hour without confirmation.

Shared-coaching database checks pass; focused lint has no errors, one existing
roster-source unused destructuring warning. Production webpack build passed with
network access for existing Sanity content and Google Fonts. A fresh IAB tab successfully reused Samo's real remembered login, loaded all
1,043 occurrences and the actual five-member Kranj roster with Nika at 18:00 as
the nearest session. Older IAB tabs were stale. Chrome's separate new OTP test
remains pending user entry; no claim about delivery is made. Samo approved the branch push and PR preview on October 7. Production merge and
trainer invitations require separate approval.
Daily Google sync and comment-mail service-key setup are still pending as described
above; importing the calendar does not activate either.

Database read-only verification confirmed snapshot scopes for all 20 active profiles
(assigned occurrences for trainers, all occurrences for admins). No calendar rows
fall on excluded days or the wrong weekday. No Auth account lacks a staff profile.

## Preview release — October 7, 2026

Samo authorized pushing the prepared branch and opening a Vercel preview PR after
local verification. This does not authorize merging to main or sending invitations.
The npm package-lock remains the deployment lockfile; local pnpm install artifacts
are not part of the portal change. Supabase CLI caches are gitignored.

The existing project already has the migrations applied. Do not replay the initial
schema against that database. Local migration timestamps for the initial, device,
membership, shared-coach and substitution files predate the corresponding remote
application timestamps; reconcile history explicitly before adopting CLI migration
deployment. staff_welcome is restored from its exact recorded remote migration.

Vercel Preview requires PORTAL_SUPABASE_URL and PORTAL_SUPABASE_ANON_KEY (server
environment variables); missing values produce the setup notice and prevent login.
Keep PORTAL_EMAIL_ENABLED=false until comment delivery is tested. Do not configure
PORTAL_LOCAL_DEMO in Vercel. Deployment alone does not activate Google sync.


## Independent release review — October 8, 2026

Two fresh subagents independently checked the portal and reviewed its code. The
review identified and fixed inactive-coach history/corrections, stale comment
outbox revisions, selection after self-replacement, and prefetch inactivity touches.
Completed hours remain visible to admins after coach access is disabled; disabled
staff still cannot log in or be assigned as replacements. Admin corrections to
closed sessions retain the original coaches and roster. Comment acknowledgments
now track mail_version independently of attendance edits. Superseded pending text
is retained but never claimed; in-flight old acknowledgments cannot overwrite a
new comment. Read-only identity/snapshot checks do not touch activity; normal
navigation and mutation RPCs do.

Verified after fixes: 13 model/proxy tests, full migration-chain regression suite,
TypeScript, focused lint (zero errors, one existing unused levels warning),
production webpack build (28 static pages), and logged-out production localhost
smoke. The reviewer rechecked the fixes with no remaining code blockers. Synthetic
fixtures also cover pre-migration sent/failed/uncertain acknowledgment repair.
Run the full-chain suite with the same PGlite setup as the original database suite:

```bash
PORTAL_PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-portal-regressions.mjs
```

Migration 20261008122202_portal_review_fixes.sql was applied once to the dedicated
project and its local filename matches the recorded remote version. Readback
confirmed mail_version, non-touching snapshot validation and service-only mail
claim permissions. All 1,043 sessions remain; no sessions were closed and the outbox
is empty. Do not reapply this migration.

The current public Supabase publishable key is compatible with the existing
PORTAL_SUPABASE_ANON_KEY variable name. It is not a privileged secret. Neža was
provided that key and the project URL for Vercel Preview and Production, with
PORTAL_EMAIL_ENABLED=false. Hosted preview remains protected by Vercel login and
needs owner verification after configuration/redeployment. Production merge is
explicitly authorized by Samo, subject to passing checks and hosted preview review.
Trainer invitation emails still require a separate explicit approval. Daily Google
sync and comment email delivery remain inactive.
