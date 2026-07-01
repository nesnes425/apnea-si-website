# Apnea.si Agent Guides

Last updated: June 12, 2026

These guides are written for Claude Code / Codex sessions used by Samo or Katarina.
They are not marketing docs and not full human manuals. They are operating rules for
an AI assistant acting on their behalf.

Before helping Samo or Katarina with Apnea.si, read:

1. `../CLAUDE.md` — website architecture, stack, coding rules
2. This index
3. The specific guide for the task:
   - `sanity-content-editing.md` — course dates and blog posts in Sanity
   - `stripe-operations.md` — Stripe payments, products, webhooks, refunds
   - `brevo-operations.md` — contacts, lists, transactional email, campaigns
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

## How To Help Samo

Assume Samo knows the business context but not the software ecosystem.

The assistant should:

1. Translate requests such as “add a new course” into the correct Sanity, Brevo,
   website, verification, and only-where-relevant Stripe steps.
2. Inspect current state before asking Samo for information.
3. Ask only for missing business facts such as date, location, capacity, trainer, or
   price.
4. Carry out safe technical steps directly and narrate them briefly.
5. Show Samo the proposed result before publishing, sending, charging, or changing live
   customer-facing data.
6. Verify the outcome and explain where Samo can see it.
7. Leave a clear record of anything unfinished or requiring another person.

Do not make Samo choose between frameworks, commands, APIs, schemas, deployment methods,
or implementation details unless the choice genuinely affects the business outcome.

## Copy Editing Workflow

Help Samo edit website copy in useful batches instead of processing isolated word
changes over many messages.

Default workflow:

1. Choose one page, audience journey, or topic, such as the homepage, beginner course,
   trainings, gift vouchers, or FAQs.
2. Inspect and summarize the current copy and where it is stored.
3. Ask Samo for corrections, missing facts, desired tone, and business priorities in one
   focused pass.
4. Propose a complete revised page or section in Slovenian.
5. Clearly identify factual assumptions that need Samo's confirmation.
6. Apply the approved changes together, then preview the page.
7. Check consistency with related CTAs, prices, FAQs, metadata, forms, and emails.

Codex may suggest a copy-review checklist or interview Samo section by section, but
should consolidate his answers before editing. Do not force batching when Samo requests
a genuinely urgent one-line correction.

## When To Ask Neža

Ask Neža when the task requires:

- A new business rule or pricing policy
- A legal, tax, invoicing, privacy, or accounting decision
- New credentials, permissions, ownership, billing, or production access
- A schema, payment architecture, webhook, deployment, domain, or analytics redesign
- An irreversible or broad production change
- A redirect/URL decision with SEO impact
- A change where two reasonable interpretations would materially affect customers

Do not ask Neža merely because:

- A command failed
- A file or setting must be found
- A routine code implementation choice is needed
- A reversible content/style edit needs execution
- Existing documentation or the codebase can answer the question

When escalation is necessary, first gather the facts and give Neža a concise decision
with a recommended option.

## Default Workflow

For any content, payment, or production-affecting change:

1. Inspect current state first.
2. Propose the exact change.
3. Ask for confirmation before publishing, deploying, refunding, or changing live payment settings.
4. After changing something, verify it in the appropriate system or on the website.

Small code edits can be made directly if requested, but still run the relevant checks
before committing.

## Keep These Guides Current

These guides are operational configuration, not background documentation.

Whenever a change affects any of the following, update the relevant guide in the same
commit:

- Connected MCPs, plugins, accounts, permissions, or tool restrictions
- Sanity schemas, fields, document types, publishing workflows, or project details
- Stripe accounts, products, prices, metadata, payment flows, or webhooks
- Brevo contacts, lists, folders, senders, templates, or available connector tools
- Website routes, environment variables, deployment, local setup, or verification steps
- What Samo/Katarina may do independently and what requires Neža

Before committing, compare the guides against the actual code and tool configuration.
Remove outdated status notes instead of allowing contradictory instructions to remain.

## Common Business Workflows

Route Samo's request to the correct guide:

- New course date, sold-out status, course reschedule, blog post:
  `sanity-content-editing.md`
- Training season, venue, program, group, capacity, trainer, applications:
  `sanity-content-editing.md`
- Payment lookup, gift voucher verification, payment/email metadata:
  `stripe-operations.md`
- Contact lookup, list membership, delivery status, campaigns:
  `brevo-operations.md`
- Text, layout, new pages, SEO, forms, integration changes:
  `website-code.md`

## Account Boundaries

Apnea.si uses two Stripe accounts:

- **Samo Jeranko s.p.** — dormant/deferred course and gift-voucher payment code
- **ŠD Apnea Slovenija** — training memberships

For launch, public course and gift-voucher flows are manual signup/povpraševanje plus
manual invoicing. Only training memberships use Stripe publicly.

Always identify and state the active Stripe account before inspecting or changing
payments. Never assume that finding no payment in one account means it does not exist.
