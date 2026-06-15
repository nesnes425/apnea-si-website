# Katarina Local Environment Template

Last updated: June 15, 2026

This is a shareable template for Katarina. It is **not** a real `.env.local` file.

To use:

1. Create a new file at the website repo root named `.env.local`.
2. Copy the block below into it.
3. Fill only the values marked `PASTE_...`.
4. Do not paste secrets into Claude/Codex chat.

Katarina should have everything needed for content/code preview work **except Stripe**.
Stripe remains Neža/Samo-only for now.

```bash
# === Sanity ===
# Safe public values:
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_PROJECT_ID="t1msc3zw"

# Secret. Create a Sanity API token for Katarina if she needs local code paths that write to Sanity.
# For normal content editing via Sanity MCP, she should use her Sanity login instead of this token.
SANITY_API_TOKEN=PASTE_KATARINA_SANITY_API_TOKEN_HERE


# === Stripe — intentionally not shared with Katarina ===
# Leave these empty unless Neža explicitly decides Katarina should test payment flows locally.
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ZACETNI=
STRIPE_PRICE_NADALJEVALNI=
STRIPE_PRICE_MASTER=
STRIPE_PRICE_GIFT_ZACETNI=
STRIPE_WEBHOOK_SECRET=

# Training Stripe account — intentionally not shared with Katarina.
TRAINING_STRIPE_SECRET_KEY=
NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY=
TRAINING_STRIPE_WEBHOOK_SECRET=


# === Brevo ===
# Secret. Only needed if Katarina must test code paths that send emails or manage Brevo contacts/lists.
# If she only edits Sanity content, she does not need this.
BREVO_API_KEY=PASTE_KATARINA_BREVO_API_KEY_HERE

# Safe/default values:
BREVO_FROM_EMAIL=info@apnea.si
BREVO_FROM_NAME=Apnea Slovenija
BREVO_NOTIFY_EMAIL=info@apnea.si

# Brevo list/folder IDs. These are not secrets; they identify existing lists/folders.
BREVO_LIST_ALUMNI_ZACETNI=91
BREVO_LIST_ALUMNI_NADALJEVALNI=92
BREVO_LIST_ALUMNI_MASTER=93
BREVO_FOLDER_TECAJNIKI=16

# Fill if Katarina needs training-list code paths. Otherwise leave blank.
BREVO_FOLDER_TRAININGS=PASTE_TRAININGS_FOLDER_ID_OR_LEAVE_EMPTY


# === Cron ===
# Secret. Usually not needed locally. Leave blank unless Neža asks.
CRON_SECRET=


# === Analytics ===
# Public IDs. Safe to share. Needed only if Katarina needs local analytics-script preview.
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-VVVEV5GLDQ
NEXT_PUBLIC_FB_PIXEL_ID=1656564067974510
```

## What Katarina Usually Needs

For normal work:

- Sanity MCP authenticated with her Sanity account
- GitHub repo access
- Local dev server
- This env file with Sanity public values

She usually does **not** need:

- Stripe keys
- Stripe webhook secret
- Vercel access
- Brevo API key, unless testing email/contact flows

