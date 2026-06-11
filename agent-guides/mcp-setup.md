# MCP Setup Guide

Last updated: June 11, 2026

Use this when helping Samo or Katarina connect Claude Code / Codex to the systems behind
Apnea.si.

## Principle

MCP should use the user’s own account whenever possible. Do not share Neža’s API tokens
or secrets.

Preferred setup:

- GitHub access gives repo context.
- Sanity login gives CMS permissions.
- Stripe login / Stripe MCP gives payment visibility.
- Other systems are added only when there is a clear workflow.

## Required MCPs

### Sanity

Purpose:

- Add/edit course dates
- Mark courses full
- Draft/edit blog posts
- Query current content

Setup:

```bash
claude mcp add --scope user Sanity --transport http https://mcp.sanity.io
```

Then restart Claude Code / Codex and authenticate.

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

Stripe MCP setup depends on the current Claude Code / Codex environment. Prefer the
official Stripe MCP and the user’s own Stripe login/account. If a secret key is required,
guide the user to configure it locally; do not paste it into chat.

First test prompt:

```text
Use Stripe MCP. Show the latest 5 test-mode payments.
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

There is no routine Brevo MCP requirement for Samo/Katarina right now. The website uses
Brevo through API code for transactional emails and contact/list management.

For Brevo operations, prefer the Brevo UI unless Neža adds a tested MCP workflow.

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
- Brevo API
- Stripe live secret keys
- Any shared mailbox with broad business history

If a connection grants broad access, pause and ask Neža.

