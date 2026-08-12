# Apnea.si — Website

Last updated: August 12, 2026

## Agent Instruction Parity

- Keep every same-scope `AGENTS.md` and `CLAUDE.md` pair equivalent.
- When changing either file, inspect and update its counterpart in the same change.
- Never commit a one-sided instruction change that would make Codex and Claude Code
  receive different project rules.
- When adding a nested agent-instruction file, add the matching counterpart at the same
  scope unless the tool cannot read that filename.
- Put detailed shared workflows in linked guide files where possible, then link those
  guides from both entry points to reduce duplication and drift.
- Treat `agent-guides/` as part of the implementation. Whenever tools, permissions,
  schemas, routes, environment variables, business workflows, or safety boundaries
  change, update the affected guides in the same change.
- Before committing, check that documented setup status and commands still match the
  actual repository and connected tools.

## Samo Support Mode

Samo is the business owner, not a developer or systems specialist. When helping him:

- Lead the workflow instead of expecting him to know which tool, file, or command to use.
- Explain the current state and the next action in plain language.
- Perform safe, discoverable technical work directly when tools allow it.
- Teach enough for Samo to understand the result, without making him operate the
  underlying infrastructure manually.
- Ask focused questions about business facts only when the answer cannot be discovered.
- Do not send routine implementation choices, troubleshooting, or reversible edits back
  to Neža. Investigate and handle those directly.
- Ask Neža only for genuine owner/developer decisions: business policy, pricing strategy,
  legal/accounting treatment, permissions or secrets, architecture, irreversible
  production changes, or ambiguous changes with meaningful customer/SEO/payment impact.
- If blocked by a Neža decision, explain exactly what decision is needed, why it matters,
  and what the safe default is.
- For website copy, avoid inefficient word-by-word editing across many messages. Suggest
  reviewing one complete page, section, or topic at a time. Gather Samo's goals and
  corrections, inspect the existing copy, propose a coherent revised version, and apply
  the approved batch together.

## Tech Stack
- Framework: Next.js 16 (App Router)
- Styling: Tailwind CSS v4 + shadcn/ui
- CMS: Sanity (course schedule, blog posts)
- Payments: Stripe Elements for training memberships. Course and gift-voucher payment
  code exists but is deferred for launch; public course/voucher flows are manual.
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
- **Stripe logic lives in `lib/stripe/`** — training payments use ŠD Apnea
  Slovenija; dormant/deferred course and voucher payment code uses Samo Jeranko s.p.
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

## Samo/Katarina Agent Guides

When Samo or Katarina use Claude Code / Codex to operate this website, read the guides in
`agent-guides/` before acting:

- `agent-guides/README.md` — guide index and global guardrails
- `agent-guides/sanity-content-editing.md` — course dates and blog posts via Sanity MCP
- `agent-guides/stripe-operations.md` — payment inspection, refunds, webhooks, voucher lookup
- `agent-guides/brevo-operations.md` — contacts, lists, transactional email, and campaigns
- `agent-guides/website-code.md` — safe code-editing rules for this site
- `agent-guides/mcp-setup.md` — how to connect Sanity, Stripe, and optional MCPs safely

Important: Samo/Katarina may have Admin access in Sanity because the current plan lacks
granular editor roles. Treat that as content-editor-only access unless Neža explicitly
says otherwise.

## Production Push Safety

The `main` branch deploys this website directly to production.

- Never push commits directly to `main`. GitHub requires a pull request and a successful
  `Vercel` status check for every production change.
- Work on a separate branch. A local commit is allowed, but pushing the branch and
  opening the PR requires the release gate below.
- Before pushing the branch, verify the affected behavior on localhost and run the
  relevant checks from `agent-guides/website-code.md`. If localhost verification is
  unavailable, incomplete, or intentionally skipped, obtain the user's explicit
  confirmation that the branch may be pushed without that check.
- Show the user what changed and report the verification result before asking for or
  acting on push approval.
- A general request to edit, fix, or implement something is not permission to push it.
  A direct request such as `git push`, `push this`, or an explicit approval after the
  change summary is permission, subject to the verification rule above.
- Use the PR's Vercel preview for the final visual/flow review. Merge the PR only after
  the `Vercel` check passes and the user explicitly approves the production merge.
- After the PR is merged, update the submodule pointer in the parent Apnea.si hub. The
  hub push does not deploy the website, but still requires a direct request or approval.
