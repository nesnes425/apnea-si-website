# Website Code Guide

Last updated: June 11, 2026

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

## Payment Routes

Course flow:

- `app/(site)/tecaji/_components/BookingPage.tsx`
- `app/(site)/tecaji/_components/BookingFlow.tsx`
- `app/(site)/tecaji/[course]/prijava/page.tsx`
- `lib/stripe/actions.ts`
- `app/api/stripe/webhook/route.ts`

Gift voucher flow:

- `app/(site)/darilni-bon/nakup/page.tsx`
- `app/(site)/darilni-bon/nakup/GiftVoucherFlow.tsx`
- `app/(site)/darilni-bon/hvala/page.tsx`
- `lib/stripe/gift-voucher-actions.ts`
- `lib/voucher-pdf/Voucher.tsx`
- `app/api/stripe/webhook/route.ts`

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
- Brevo:
  - `BREVO_API_KEY`
  - `BREVO_LIST_ALUMNI_*`
  - `BREVO_FOLDER_TECAJNIKI`
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

## Commit Model

This website is a git submodule inside the Apnea.si hub. Commit inside the website repo first, then update the hub pointer. The Produktnica parent repo points at the hub, not directly at this website checkout.

Workflow:

```bash
cd clients/samo-jeranko/apnea-si-hub/website/apnea-si-website
git status
git add ...
git commit -m "..."
git push origin main

cd ../..
git add website/apnea-si-website
git commit -m "Apnea.si: update submodule pointer"
git push origin main
```

Do not commit unrelated parent-monorepo changes unless the user explicitly asks.
