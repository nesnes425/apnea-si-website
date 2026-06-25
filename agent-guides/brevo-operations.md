# Brevo Operations Guide

Last updated: June 12, 2026

Use this when Samo or Katarina asks Claude Code / Codex about Apnea.si contacts, lists,
transactional email, or campaigns in Brevo.

## Current Brevo Architecture

One Brevo account is used for:

- Booking confirmation emails
- Training confirmation emails
- Gift voucher delivery
- Contact and speaking inquiry notifications
- Course-date contact lists
- Course alumni lists
- Training-group contact lists
- Marketing campaigns sent from the Brevo UI

Stripe webhooks create or update contacts and add them to the relevant lists. Course and
training list IDs are also stored in Sanity documents.

## Access Model

Prefer the Brevo UI for campaigns and account settings. Brevo has an official MCP
server, but its MCP token grants full read/write access to the account.

Use the user's own Brevo login and grant only the access needed for contacts, lists,
templates, transactional logs, and campaigns. Do not share Neža's login or the website's
production API key.

For initial Codex access, expose only the focused contacts MCP endpoint:

```text
https://mcp.brevo.com/v1/brevo_contacts/mcp
```

The focused endpoint reduces the available tool set. In Codex, disable `create_contact`,
`update_contact`, and `delete_contact` so Samo/Katarina have read-only contact access.
The underlying MCP token must still be treated as a full-access secret.

## Safe Read-Only Tasks

- Find a contact by email
- Inspect contact details and recent contact statistics

The currently connected focused endpoint does not expose list administration,
transactional delivery logs, or campaign tools. Use the Brevo UI for those tasks.

## Changes Requiring Confirmation

Show the exact proposed action and wait for confirmation before:

- Sending or scheduling a campaign
- Sending a one-off transactional email
- Importing or bulk-updating contacts
- Moving contacts between lists
- Deleting or blocklisting a contact
- Editing a live transactional template or sender

Never send a test campaign to a production list. Use a dedicated test list containing
only approved internal addresses. Keep campaign sending in the Brevo UI until a focused
MCP workflow has been reviewed and tested.

## Lists Managed By The Website

The website automatically manages:

- A list for each course date
- Alumni lists for beginner, advanced, and master courses
- A list for each training group

Do not rename, delete, or manually replace these lists without checking the associated
Sanity document and webhook configuration. Never manually edit `brevoListId` in Sanity.

## API Credentials

The website needs `BREVO_API_KEY` in local/Vercel environment variables. It also uses:

- `BREVO_FROM_EMAIL`
- `BREVO_FROM_NAME`
- `BREVO_NOTIFY_EMAIL`
- `BREVO_FOLDER_TECAJNIKI`
- `BREVO_FOLDER_TRAININGS`
- `BREVO_LIST_ALUMNI_ZACETNI`
- `BREVO_LIST_ALUMNI_NADALJEVALNI`
- `BREVO_LIST_ALUMNI_MASTER`

Never print, commit, or paste the API key into chat. Samo/Katarina do not need the
production API key for normal UI work.

Codex MCP access must use a separate `BREVO_MCP_TOKEN`, not `BREVO_API_KEY`.

## What Not To Do

- Do not connect the all-features Brevo MCP by default.
- Do not send or schedule campaigns without explicit confirmation.
- Do not delete lists created by the website.
- Do not change senders, domain authentication, webhooks, or API keys without Neža.
- Do not export the full contact database unless there is a clear approved purpose.
- Do not promise delivery based only on a successful API request; verify the Brevo log.
