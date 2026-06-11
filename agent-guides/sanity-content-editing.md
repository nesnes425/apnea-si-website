# Sanity Content Editing Guide

Last updated: June 11, 2026

Use this when Samo or Katarina asks Claude Code / Codex to edit Apnea.si content in Sanity.

## Sanity Project

- Project ID: `t1msc3zw`
- Dataset: `production`
- Studio route in the website: `/studio`
- Main editable document types:
  - `courseInstance` — course dates
  - `blogPost` — blog/news posts

Samo and Katarina may have **Admin** access because the current Sanity plan only offers
Administrator, Blueprint Developer, and Viewer roles. Treat their access as
**content-editor-only**. Do not touch Sanity project settings, schemas, datasets, tokens,
billing, or API configuration unless Neža explicitly asks.

## MCP Setup

Use Sanity MCP, not raw API tokens.

Expected MCP server:

```bash
claude mcp add --scope user Sanity --transport http https://mcp.sanity.io
```

Then restart Claude Code / Codex and authenticate with the user’s own Sanity login.

Check:

```bash
claude mcp list
```

Expected:

```text
Sanity: https://mcp.sanity.io (HTTP) - ✓ Connected
```

## Golden Rule

For Samo/Katarina workflows, default to:

> Draft or patch the content, show the proposed change, and wait for confirmation before publishing.

Do not publish silently unless the user explicitly says “publish it now” after seeing the summary.

## `courseInstance` — Course Dates

Fields:

- `courseType`: `zacetni`, `nadaljevalni`, `master`
- `startDate`: ISO date, e.g. `2027-05-12`
- `endDate`: ISO date, e.g. `2027-05-13`
- `location`: one of `Ljubljana`, `Nova Gorica`, `Velenje`, `Novo Mesto`, `Koper`
- `maxSpots`: usually `15`
- `isFull`: `false` by default, `true` when sold out
- `notes`: short internal/display note
- `brevoListId`: automatic, read-only in Studio

Never edit `brevoListId` manually. It is written by the Stripe/Brevo webhook after the
first booking for that slot.

### Add A Course Date

Prompt pattern:

```text
Use Sanity MCP. Create a draft courseInstance:
courseType: zacetni
location: Ljubljana
startDate: 2027-05-12
endDate: 2027-05-13
maxSpots: 15
isFull: false
notes: Bazenski del: Fakulteta za šport. Globinski del po dogovoru.
Show me the draft before publishing.
```

Before creating:

1. Query existing upcoming `courseInstance` documents.
2. Check for duplicates with same `courseType`, `startDate`, and `location`.
3. If a likely duplicate exists, ask before creating another.

After publishing:

1. Confirm document ID.
2. Tell the user which website page should show it:
   - `zacetni` → `/tecaji/zacetni`
   - `nadaljevalni` → `/tecaji/nadaljevalni`
   - `master` → `/tecaji/master`

### Mark A Course Full

Prompt pattern:

```text
Use Sanity MCP. Find the beginner course in Ljubljana on 2027-05-12.
Set isFull to true, show me the change, then wait before publishing.
```

Always identify the exact document before patching.

### Change A Date

Be careful: if bookings already exist, changing a course date can confuse customers,
Brevo lists, and Stripe metadata.

Before changing any date:

1. Check whether `brevoListId` exists.
2. If `brevoListId` exists, warn the user that bookings likely exist.
3. Ask whether this is a real reschedule or a correction.

If it is a real reschedule, recommend emailing booked participants manually via Brevo.

## `blogPost` — Blog Posts

Editable:

- `title`
- `body`
- `featuredImage`
- `categories`
- `metaDescription`

Be careful:

- `slug`

Do not change a published blog slug unless Neža explicitly confirms the redirect plan.
Old Apnea.si redirects are handled in `next.config.ts`; changing slugs can break SEO.

## Good Prompts For Samo/Katarina

```text
Use Sanity MCP. Show all upcoming beginner course dates.
```

```text
Use Sanity MCP. Mark the June beginner course as razprodano. Show the exact document first.
```

```text
Use Sanity MCP. Draft a blog post from these notes. Do not publish yet.
```

```text
Use Sanity MCP. Find blog posts where the title mentions izenačevanje.
```

## What Not To Do

- Do not edit schemas from Sanity Studio.
- Do not create or delete datasets.
- Do not create API tokens.
- Do not manually edit `brevoListId`.
- Do not change blog slugs without a redirect plan.
- Do not publish large content changes without showing a preview/summary first.

