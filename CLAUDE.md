# Apnea.si — Website

## Tech Stack
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4 + shadcn/ui
- CMS: Sanity (course schedule, blog posts)
- Payments: Stripe Elements (two accounts — s.p. for courses, ŠD for trainings)
- Email: Brevo (transactional + marketing)
- Analytics: GA4 + Facebook Pixel (consent-gated)
- Deployment: Vercel
- Language: Slovenian (sl)

## Coding Standards
Follow the Produktnica website coding standards:
`business/knowledge-base/website-coding-standards.md` in the monorepo.

## Key Rules
- **All user-facing text is Slovenian.** HTML lang="sl".
- **Server components first.** Only `"use client"` when truly needed (forms, interactivity).
- **Config before components.** All business data imports from `lib/config.ts`.
- **Sanity is the source of truth** for course schedule and blog posts. Never hardcode course dates.
- **Course details (curriculum, pricing, FAQs, testimonials) are hardcoded** on landing pages — they rarely change.
- **Stripe logic lives in `lib/stripe/`** — two accounts: Samo Jeranko s.p. (courses) + ŠD Apnea Slovenija (trainings).
- **Brevo for all email** — transactional (booking confirmations) + marketing (newsletter). One provider, one contact database.
- **No fake urgency.** "Še prosta mesta" and "Razprodano" come from real Sanity data.
- **Never leave a page with stock photos or grey placeholders.** Always use real freediving imagery.

## Architecture
```
app/                  — Next.js App Router pages
components/
  ui/                 — Primitives: Button, Card, Input, Badge (shadcn/ui)
  layout/             — Header, Footer, Container, Section
  blocks/             — Reusable page sections: Hero, FAQ, CTA, CourseCard, etc.
lib/
  config.ts           — All site constants (contact, pricing, nav, stats)
  utils.ts            — Shared utilities (cn, formatPrice, etc.)
  sanity/
    client.ts         — Sanity client setup
    types.ts          — TypeScript types from Sanity schemas
    queries.ts        — All GROQ queries
  stripe/
    client.ts         — Stripe client setup
    actions.ts        — Server actions for payment flows
  brevo/
    client.ts         — Brevo API client
```

## Design Tokens
- **Navy:** #33404f (headings, buttons, dark backgrounds)
- **Navy dark:** #181E25 (navbar, mobile nav)
- **Gold:** #d3a356 (primary accent, CTAs, links)
- **Gold hover:** #c18f3e
- **Body text:** #585a5a
- **Heading font:** Lora (serif)
- **Body font:** Roboto (sans-serif)

## Before Every Session
- Check `lib/config.ts` exists and is up to date
- New components follow existing patterns in `components/blocks/`
- Run `npm run build` before committing — fix all errors and warnings
