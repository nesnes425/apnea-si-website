# Sanity Content Editing Guide

Last updated: June 12, 2026

Use this when Samo or Katarina asks Claude Code / Codex to edit Apnea.si content in Sanity.

## Sanity Project

- Project ID: `t1msc3zw`
- Dataset: `production`
- Studio route in the website: `/studio`
- Main editable document types:
  - `courseInstance` — course dates
  - `blogPost` — blog/news posts
  - `trainingSettings` — season, applications, membership fee, reservation time
  - `trainingVenue` — pool/location, season dates, default pricing
  - `trainingProgram` — program descriptions and placement guidance
  - `trainingGroup` — weekly group schedule, capacity, trainer, overrides

Samo and Katarina may have **Admin** access because the current Sanity plan only offers
Administrator, Blueprint Developer, and Viewer roles. Treat their access as
**content-editor-only**. Do not touch Sanity project settings, schemas, datasets, tokens,
billing, or API configuration unless Neža explicitly asks.

## MCP Setup

Use Sanity MCP, not raw API tokens.

Expected MCP server:

```bash
codex mcp add sanity --url https://mcp.sanity.io
codex mcp login sanity
```

Then restart Codex if needed and authenticate with the user’s own Sanity login.

Check:

```bash
codex mcp list
```

Expected:

```text
sanity: https://mcp.sanity.io
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

## Training Operations

Training data is split into four document types. Inspect all related documents before
changing a group so the assistant understands inherited dates and prices.

### `trainingSettings`

Editable:

- `seasonLabel`
- `applicationsOpen`
- `membershipFee`
- `holdMinutes`

Opening applications affects every active training group. Before changing
`applicationsOpen` to `true`, verify that active venues, programs, groups, capacities,
dates, prices, and Stripe test/live configuration are correct.

### `trainingVenue`

Editable:

- Pool/location name, city, address, description, image
- Default season start/end dates
- Default monthly price and installment amounts
- Sort order and active status

Changing venue defaults can affect every group at that venue unless the group has an
override. Show the affected groups before publishing.

### `trainingProgram`

Editable:

- Name and short/long description
- Placement guidance and equipment
- Image, sort order, active status

Do not change a published program slug without checking website links.

### `trainingGroup`

Editable:

- Venue and program references
- Weekday and start/end time
- Capacity
- Optional date and pricing overrides
- Trainer, notes, active status

Automatic/read-only:

- `confirmedSpots`
- `holds`
- `brevoListId`
- `confirmedPaymentIntentIds`

Never manually edit automatic fields.

### Add Or Change A Training Group

Before changing:

1. Query current settings, venue, program, and active groups.
2. Check for a duplicate venue/program/day/time combination.
3. Show effective dates and prices, including inherited venue defaults and group
   overrides.
4. If confirmed spots or a Brevo list exist, warn that participants may already be
   affected.
5. Draft the exact change and wait for confirmation before publishing.

After publishing:

1. Confirm the group ID.
2. Verify it appears on `/treningi`.
3. Verify the registration link includes the correct `groupId`.
4. If applications are open, confirm available capacity is non-negative.

### Common Training Prompts

```text
Use Sanity MCP. Show the current training season, whether applications are open, and
all active groups with venue, program, time, capacity, confirmed spots, and available
spots. Do not change anything.
```

```text
Use Sanity MCP. Draft a new beginner training group at DIF on Tuesday from 19:00 to
20:30 with capacity 8 and trainer Samo. Check for duplicates and inherited prices first.
Do not publish until I confirm.
```

```text
Use Sanity MCP. Prepare opening training applications. First verify settings, active
groups, capacities, dates, and effective prices. Show any problems and wait for my
confirmation before publishing.
```

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
- Do not manually edit training holds, confirmed spots, confirmed PaymentIntent IDs, or
  any other automatic training field.
- Do not open training applications before validating groups, dates, prices, capacity,
  and payment configuration.
- Do not change blog slugs without a redirect plan.
- Do not publish large content changes without showing a preview/summary first.
