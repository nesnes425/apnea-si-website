# MCP Setup Guide

Last updated: June 12, 2026

Use this when helping Samo or Katarina connect Claude Code / Codex to the systems behind
Apnea.si.

## Principle

MCP should use the user’s own account whenever possible. Do not share Neža’s API tokens
or secrets.

Preferred setup:

- GitHub access gives repo context.
- Sanity login gives CMS permissions.
- Stripe login / Stripe MCP gives payment visibility, but each of the two Stripe
  accounts must be verified separately.
- Other systems are added only when there is a clear workflow.

## Katarina Profile

Katarina should get everything needed for content and website-preview work **except
Stripe**.

Recommended for Katarina:

- Sanity MCP — yes, required
- Brevo MCP/API — only if she will manage Brevo lists/campaigns or test email flows
- Browser/local preview — yes, useful for checking website changes
- Gmail for `info@apnea.si` — optional, only if she will help with support/customer email
- Stripe MCP — no, keep with Neža/Samo for now
- Vercel — no, keep with Neža for now

If a task touches money, refunds, live webhooks, environment variables, or deployment
settings, pause and ask Neža.

## Required MCPs

### Sanity

Purpose:

- Add/edit course dates
- Mark courses full
- Draft/edit blog posts
- Query current content

Setup:

```bash
codex mcp add sanity --url https://mcp.sanity.io
codex mcp login sanity
```

Then restart Codex if the tools do not appear immediately. Authenticate with the
user's own Sanity login; do not use a shared API token.

During OAuth, Codex opens a temporary `http://127.0.0.1:<port>/callback/...` URL. This
localhost address is only the secure callback into the local Codex app. The MCP server
remains `https://mcp.sanity.io` and operates on Sanity's cloud project and datasets.

First test prompt:

```text
Use Sanity MCP. Show all upcoming courseInstance documents for project t1msc3zw, dataset production.
```

### Stripe

Purpose:

- Inspect payments
- Check gift voucher codes
- Verify webhook/email metadata
- Help with refunds after confirmation

Required account coverage:

- Samo Jeranko s.p. — courses and gift vouchers
- ŠD Apnea Slovenija — training memberships

Current status as of June 12, 2026:

- `stripe-trainings` is connected to the live ŠD Apnea Slovenija account and restricted
  to read-only tools.
- `stripe-courses` is connected to the Samo Jeranko s.p. account and restricted to
  read-only tools.

Codex also offers an official Stripe plugin. For Apnea.si, prefer the two named MCP
connections over the generic plugin connector because the site uses two separate Stripe
accounts. The explicit names make account selection auditable and reduce the risk of
querying the wrong account. The plugin's Stripe implementation skills may still be used
for development guidance without replacing these account-specific connections.

Stripe MCP setup depends on the current Claude Code / Codex environment. Prefer the
official Stripe MCP and the user’s own Stripe login/account. If a secret key is required,
guide the user to configure it locally; do not paste it into chat.

Do **not** set this up for Katarina unless Neža explicitly changes the access model.

Codex setup:

```bash
codex mcp add stripe-courses --url https://mcp.stripe.com
codex mcp login stripe-courses

codex mcp add stripe-trainings --url https://mcp.stripe.com
codex mcp login stripe-trainings
```

Authorize `stripe-courses` while signed into Samo Jeranko s.p. and
`stripe-trainings` while signed into ŠD Apnea Slovenija. Stripe administrators may need
to enable MCP access separately for sandbox and live mode.

Recommended Codex tool policy for both Stripe connections:

- Enable read-only account, balance, list, search, fetch, and documentation tools.
- Disable all create, update, finalize, refund, and cancel tools.
- Treat Samo's Stripe MCP access as fully read-only.
- If Katarina is explicitly granted Stripe access later, apply the same read-only policy.

The exact read/write classification is documented in `stripe-operations.md`.

Run a read-only test against each account and explicitly name the expected account:

```text
Use Stripe MCP with the Samo Jeranko s.p. account. Show the latest 5 test-mode payments.
Do not change anything.
```

```text
Use Stripe MCP with the ŠD Apnea Slovenija account. Show the latest 5 test-mode
payments. Do not change anything.
```

## Optional MCPs

### Gmail

Only connect if Samo/Katarina want the assistant to inspect `info@apnea.si` mail,
draft replies, or find customer messages. Be careful: email is sensitive.

Default behavior:

- Draft replies, do not send without confirmation.
- Do not archive/delete without explicit confirmation.

### Google Calendar

Only connect if course scheduling or availability management moves into Calendar.
Currently course dates live in Sanity, not Calendar.

### Brevo

Brevo provides an official MCP server, but its MCP token grants full read/write account
access. Do not connect the all-features endpoint by default.

Recommended initial endpoint:

```text
https://mcp.brevo.com/v1/brevo_contacts/mcp
```

This exposes contact operations rather than campaign sending, domains, users, webhooks,
or account administration. Disable `create_contact`, `update_contact`, and
`delete_contact` so Samo/Katarina receive read-only contact access. The token itself is
still powerful and must be stored in an environment variable, never directly in the
repo or chat.

Codex configuration:

```bash
codex mcp add brevo-contacts \
  --url https://mcp.brevo.com/v1/brevo_contacts/mcp \
  --bearer-token-env-var BREVO_MCP_TOKEN
```

Equivalent manual configuration:

```toml
[mcp_servers.brevo-contacts]
url = "https://mcp.brevo.com/v1/brevo_contacts/mcp"
bearer_token_env_var = "BREVO_MCP_TOKEN"
default_tools_approval_mode = "prompt"
disabled_tools = ["create_contact", "update_contact", "delete_contact"]
```

Create a separate Brevo MCP token for Samo's Codex access. Do not reuse
`BREVO_API_KEY`, which belongs to the production website runtime.

Keep campaign creation/sending in the Brevo UI initially. Add focused campaign or
analytics MCP endpoints only after the operating workflow and confirmations have been
tested.

### Vercel

Do not give routine Vercel access to Samo/Katarina unless they need deployments/env vars.
Vercel contains production environment configuration. Neža should own it for now.

## Verification Checklist

After setting up an MCP:

1. Run the MCP list/check command.
2. Ask a read-only question first.
3. Confirm the assistant sees the correct account/project.
4. Only then attempt a draft/write operation.
5. For any write operation, show proposed changes before publishing/applying.

## Good Prompt Template

```text
Use [SYSTEM] MCP. First inspect the current state. Then propose the exact change.
Do not publish/apply/refund/send anything until I confirm.
```

Examples:

```text
Use Sanity MCP. First inspect upcoming course dates. Then propose adding this new beginner course. Do not publish until I confirm.
```

```text
Use Stripe MCP. Find payment for customer ana@example.com. Show me the amount, status, metadata, and whether emailSent is true. Do not refund anything.
```

## What Not To Connect Casually

- Vercel
- Brevo's all-features MCP endpoint
- Stripe live secret keys
- Any shared mailbox with broad business history

If a connection grants broad access, pause and ask Neža.
