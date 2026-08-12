# Website Code Guide

Last updated: August 12, 2026

Use this when Samo or Katarina asks Claude Code / Codex to change Apnea.si website code.

## First Read

Before editing, read:

1. `../CLAUDE.md`
2. This guide
3. Relevant files in `app/`, `components/`, `lib/`, or `sanity/`

The repo is a Next.js App Router website with Sanity, Stripe, Brevo, cookie consent,
SEO redirects, sitemap, and structured data.

## Coding Rules

- User-facing text must be Slovenian.
- Prefer server components. Use `"use client"` only for forms, browser APIs, state, or Stripe Elements.
- Business constants live in `lib/config.ts`.
- Course dates and blog posts come from Sanity. Never hardcode course dates in pages.
- Reuse design primitives:
  - `components/ui/button.tsx`
  - `components/ui/input.tsx`
  - existing block components in `components/blocks/`
- Do not add another inline gold-button class string. Use `<Button>`.
- Keep payment code in `lib/stripe/`.
- Keep Brevo API code in `lib/brevo/`.
- Keep Sanity queries in `lib/sanity/queries.ts`.

## Safe Change Types

Usually safe:

- Copy edits
- Adding a new static section
- Updating page metadata
- Adding a non-payment page
- Adjusting styling through existing components
- Adding Sanity-powered content display

Needs extra care:

- Payment flow changes
- Webhook changes
- Brevo email changes
- Redirect changes in `next.config.ts`
- Cookie consent / analytics changes
- Sanity schema changes

Ask for Neža’s confirmation before making high-risk changes.

## Copy Changes

When Samo wants to improve website text, recommend reviewing a complete page or logical
section rather than making a sequence of isolated word changes.

Before editing:

1. Find all copy for the selected page, including `lib/config.ts`, page components,
   metadata, FAQs, CTAs, forms, and related emails.
2. Show Samo a concise inventory of the existing sections.
3. Ask for business corrections and tone preferences together.
4. Draft a coherent Slovenian revision and flag uncertain facts.

After approval, update the full batch, preview it locally, and check that related pages
do not contradict it. A small urgent correction can still be made directly when batching
would add unnecessary delay.

## Signup And Payment Routes

Course launch flow is manual signup, not visible Stripe payment:

- `app/(site)/tecaji/_components/BookingPage.tsx`
- `app/(site)/tecaji/_components/BookingFlow.tsx`
- `app/(site)/tecaji/[course]/prijava/page.tsx`
- `lib/course-application-actions.ts`
- `app/(site)/tecaji/hvala/page.tsx` — noindex fallback only; inline confirmation on
  the signup page is the normal path.

Gift voucher launch flow is manual povpraševanje, not visible Stripe payment:

- `app/(site)/darilni-bon/nakup/page.tsx`
- `app/(site)/darilni-bon/nakup/GiftVoucherFlow.tsx`
- `lib/gift-voucher-request-actions.ts`
- `app/(site)/darilni-bon/hvala/page.tsx` — noindex fallback only; inline confirmation
  on the request page is the normal path.

Training launch flow uses Stripe online payment:

- `app/(site)/treningi/prijava/page.tsx`
- `app/(site)/treningi/prijava/TrainingSignupForm.tsx`
- `app/(site)/treningi/hvala/page.tsx`
- `lib/stripe/training-actions.ts`
- `app/api/stripe/training-webhook/route.ts`

Dormant/deferred course and voucher payment code remains in `lib/stripe/`,
`app/api/stripe/webhook/route.ts`, and voucher PDF files for possible later reuse. Do
not expose it publicly unless Neža explicitly changes the launch scope.

## SEO / Redirects

Redirects live in `next.config.ts`.

Be careful with:

- old WordPress URLs
- migrated blog post slugs
- `/prosto-potapljanje`
- `/prijava`
- WooCommerce routes (`/shop`, `/cart`, `/checkout`, `/my-account`)

Changing redirects can damage SEO. Spot-test with `curl -I` or browser after editing.

## Environment Variables

Never commit `.env.local`.

Important local/Vercel variables include:

- Sanity:
  - `NEXT_PUBLIC_SANITY_PROJECT_ID`
  - `NEXT_PUBLIC_SANITY_DATASET`
  - `SANITY_API_TOKEN`
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_*`
  - `TRAINING_STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY`
  - `TRAINING_STRIPE_WEBHOOK_SECRET`
- Brevo:
  - `BREVO_API_KEY`
  - `BREVO_FROM_EMAIL`
  - `BREVO_FROM_NAME`
  - `BREVO_NOTIFY_EMAIL`
  - `BREVO_LIST_APNEA_NEWSLETTER`
  - `BREVO_LIST_IZENACEVANJE_PRIJAVE`
  - `BREVO_LIST_ALUMNI_*`
  - `BREVO_FOLDER_TECAJNIKI`
  - `BREVO_FOLDER_TRAININGS`
- Minimax training invoicing:
  - `MINIMAX_CLIENT_ID`
  - `MINIMAX_CLIENT_SECRET`
  - `MINIMAX_SUBSCRIPTION_KEY`
  - `MINIMAX_ORGANIZATION_ID`
  - `MINIMAX_TRAINING_INVOICING_ENABLED`
  - `MINIMAX_TRAINING_RECORD_PAYMENT`
  - `MINIMAX_TRAINING_REQUIRE_PDF`
  - `MINIMAX_TRAINING_*`
- Ops:
  - `CRON_SECRET`
- Analytics:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_FB_PIXEL_ID`

If a variable is missing, guide the user to set it locally or in Vercel. Do not ask them
to paste secrets into chat.

## Required Checks Before Commit

Run:

```bash
npm run build
```

If changing TypeScript-heavy code, also run:

```bash
npx tsc --noEmit
```

If changing frontend UI, preview in browser at `http://localhost:3000`.

If changing payment/webhook code, test with Stripe test mode before considering done.

## Commit And Production Push Model

This website is a git submodule inside the Apnea.si hub. Commit inside the website repo
first, then update the hub pointer. A local commit does not deploy the site, but pushing
`main` to GitHub deploys directly to production.

Before pushing a working branch:

1. Show the user a concise summary of the changed files and behavior.
2. Run the relevant checks above and verify the affected flow on localhost.
3. Report what passed, what failed, and what was not checked.
4. Push the branch and open a PR only after the user directly requests or explicitly
   approves that step.

If localhost verification cannot be completed, do not push unless the user explicitly
confirms that the changes may be pushed without it. A request to edit, fix, or implement
is not implicit push approval.

Never push directly to `main`. The active GitHub ruleset requires a pull request and the
`Vercel` status check. After the branch is pushed, use the Vercel preview linked from the
PR for final review. Merge only after the check passes and the user explicitly approves
the production merge.

The Vercel Preview environment must include the public Sanity variables
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and
`NEXT_PUBLIC_SANITY_API_VERSION`; otherwise the preview build fails while generating
Sanity-backed routes such as `sitemap.xml`.

Workflow:

```bash
cd website/apnea-si-website
git status
git switch -c codex/<short-change-name>
git add ...
git commit -m "..."
# Stop here for the verification and approval gate.
git push -u origin codex/<short-change-name>
# Open a PR against main and wait for the Vercel check and user merge approval.

cd ../..
git add website/apnea-si-website
git commit -m "Apnea.si: update submodule pointer"
# The hub push does not deploy the website, but still requires direct approval.
git push origin main
```

Do not commit unrelated changes unless the user explicitly asks.
