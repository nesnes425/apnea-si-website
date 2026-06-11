# Stripe Operations Guide

Last updated: June 11, 2026

Use this when Samo or Katarina asks Claude Code / Codex about Apnea.si payments.

## Current Stripe Architecture

Courses and gift vouchers use Stripe Elements through PaymentIntents.

Stripe products/prices are templates only. The actual course date, location, and
customer details are stored on the PaymentIntent metadata.

Current payment flows:

- Course booking:
  - `/tecaji/zacetni/prijava`
  - `/tecaji/nadaljevalni/prijava`
  - `/tecaji/master/prijava`
  - Confirmation: `/tecaji/hvala`
- Gift voucher:
  - `/darilni-bon/nakup`
  - Confirmation: `/darilni-bon/hvala`

Webhook route:

- `/api/stripe/webhook`

The webhook sends Brevo emails and marks successful PaymentIntents with:

```text
emailSent=true
```

## MCP Setup

Use Stripe MCP for inspection and operator help. Do not ask Samo/Katarina to paste
secret keys into chat.

If MCP is not configured, guide the user through the official Stripe MCP setup used by
Claude Code / Codex. Prefer user-level config. Use test mode first.

## What Samo/Katarina Can Safely Ask

Good prompts:

```text
Use Stripe MCP. Show the latest 10 successful payments.
```

```text
Use Stripe MCP. Find payments where customer email is ana@example.com.
```

```text
Use Stripe MCP. Show metadata for payment pi_...
```

```text
Use Stripe MCP. Find the gift voucher payment whose code ends with A7K9F2.
```

```text
Use Stripe MCP. Check whether payment pi_... has emailSent=true.
```

## Refunds

Refunds are production-affecting. Never refund silently.

Workflow:

1. Find the payment.
2. Show amount, customer, date, product/course, and metadata.
3. Ask the user to confirm the refund.
4. Only then create the refund.
5. After refunding, explain that Brevo/customer communication may still need to be sent manually.

Do not promise automatic accounting treatment. Stripe receipts are not the same thing
as Slovenian accounting invoices; Samo’s accountant / Zoho Books decision is separate.

## Webhooks

Production emails only work if Stripe has a webhook endpoint configured:

```text
https://<production-domain>/api/stripe/webhook
```

Required event:

```text
payment_intent.succeeded
```

Vercel must have the matching:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Test mode and live mode have different webhook secrets.

## Live Mode Rules

Before launch:

1. Recreate Stripe products/prices in live mode.
2. Replace Vercel env vars:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_ZACETNI`
   - `STRIPE_PRICE_NADALJEVALNI`
   - `STRIPE_PRICE_MASTER`
   - `STRIPE_PRICE_GIFT_ZACETNI`
   - `STRIPE_WEBHOOK_SECRET`
3. Redeploy Vercel.
4. Run one real low-risk payment test if Samo approves.

Do not mix test keys with live price IDs or live keys with test price IDs.

## Gift Voucher Redemption

Gift voucher codes are derived from PaymentIntent IDs:

```text
last 6 characters of PaymentIntent ID, uppercased
```

Recipient emails `info@apnea.si` with the code. Samo/Katarina can use Stripe MCP to
search for the matching PaymentIntent and verify payment.

No automatic redemption system exists yet.

## What Not To Do

- Do not expose secret keys.
- Do not change live products/prices without Neža.
- Do not register or delete webhooks casually.
- Do not refund without explicit confirmation.
- Do not treat Stripe receipts as final Slovenian invoice policy.

