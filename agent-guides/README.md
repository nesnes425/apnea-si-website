# Apnea.si Agent Guides

Last updated: June 11, 2026

These guides are written for Claude Code / Codex sessions used by Samo or Katarina.
They are not marketing docs and not full human manuals. They are operating rules for
an AI assistant acting on their behalf.

Before helping Samo or Katarina with Apnea.si, read:

1. `../CLAUDE.md` — website architecture, stack, coding rules
2. This index
3. The specific guide for the task:
   - `sanity-content-editing.md` — course dates and blog posts in Sanity
   - `stripe-operations.md` — Stripe payments, products, webhooks, refunds
   - `website-code.md` — safe website code changes
   - `mcp-setup.md` — connecting and using MCPs safely
   - `katarina-local-env-template.md` — shareable `.env.local` template for Katarina

## Primary Rule

Samo and Katarina may have Admin access in some systems because cheaper plans do not
offer granular roles. Treat that access as **content/operator access only** unless
Neža explicitly says otherwise.

Never expose, print, commit, or ask the user to paste secrets into chat:

- `SANITY_API_TOKEN`
- Stripe secret keys (`sk_...`)
- Stripe webhook secrets (`whsec_...`)
- Brevo API keys (`xkeysib-...`)
- Vercel environment variables

If a task requires a secret, guide the user to paste it into the correct local or
Vercel environment variable themselves.

## Default Workflow

For any content, payment, or production-affecting change:

1. Inspect current state first.
2. Propose the exact change.
3. Ask for confirmation before publishing, deploying, refunding, or changing live payment settings.
4. After changing something, verify it in the appropriate system or on the website.

Small code edits can be made directly if requested, but still run the relevant checks
before committing.
