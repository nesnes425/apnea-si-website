# Stripe Operations Guide

Last updated: June 11, 2026

Use this when Samo or Katarina asks Claude Code / Codex about Apnea.si payments.

## Current Stripe Architecture

Apnea.si uses two separate Stripe accounts:

- **Samo Jeranko s.p.** — dormant/deferred course and gift-voucher payment code
- **ŠD Apnea Slovenija** — training memberships

Always identify and state which account is active before searching, refunding, or
changing anything. A connector authenticated to one account cannot be assumed to cover
the other.

For launch, only training memberships use Stripe publicly. Courses and gift vouchers
use manual signup/povpraševanje plus manual invoicing; their older Stripe code remains
in the repository for possible later reuse, but it should not be visible to visitors.
Stripe products/prices are templates only. The actual training group, location, and
customer details are stored on PaymentIntent metadata.

Current public launch flows:

- Course booking, manual:
  - `/tecaji/zacetni/prijava`
  - `/tecaji/nadaljevalni/prijava`
  - `/tecaji/master/prijava`
  - Confirmation happens inline on the signup page. `/tecaji/hvala` is a noindex
    fallback page only.
- Gift voucher, manual:
  - `/darilni-bon/nakup`
  - Confirmation happens inline on the request page. `/darilni-bon/hvala` is a noindex
    fallback page only.
- Training membership, online payment:
  - `/treningi/prijava`
  - Confirmation: `/treningi/hvala`

Webhook routes:

- Courses and vouchers: `/api/stripe/webhook` is dormant/deferred for launch
- Trainings: `/api/stripe/training-webhook`

The training webhook sends Brevo emails and marks successful PaymentIntents with:

```text
Trainings: trainingProcessed=true
```

## Training Minimax Invoicing

Live training payments create a Minimax issued invoice before the Brevo customer email
is sent. The production integration was validated before the July 10, 2026 launch and
is required for every live training payment.

Environment flag:

```text
MINIMAX_TRAINING_INVOICING_ENABLED=true
```

When enabled, the training webhook:

1. Confirms the Sanity training hold.
2. Creates or resumes a Minimax issued invoice from Stripe PaymentIntent metadata.
3. Generates the official invoice PDF.
4. Attaches the generated PDF to the customer confirmation email.
5. Marks the PaymentIntent with Minimax metadata:

```text
minimaxInvoiceStatus=completed|failed
minimaxIssuedInvoiceId=<id>
minimaxInvoiceNumber=<number>
minimaxPdfGenerated=true|false
```

If Minimax invoicing is disabled for a live payment, or invoice/PDF creation fails, the
payment is not marked as processed and the customer confirmation email is not sent. The
webhook alerts the admin address and returns an error so Stripe retries. Never disable
`MINIMAX_TRAINING_INVOICING_ENABLED` in production.

Payment posting inside Minimax is disabled by default. Set
`MINIMAX_TRAINING_RECORD_PAYMENT=true` only after accountant/FURS setup confirms how
Stripe card payments should map to Minimax payment method, cash register, and revenue
fields.

## MCP Setup

Use Stripe MCP for inspection and operator help. Confirm whether it is connected to
Samo Jeranko s.p. or ŠD Apnea Slovenija before every task. Separate connections or
account switching may be required.

Do not ask Samo/Katarina to paste secret keys into chat.

If MCP is not configured, guide the user through the official Stripe MCP setup used by
Claude Code / Codex. Prefer user-level config. Use test mode first.

## MCP Tool Policy

Treat these official Stripe MCP tools as read-only:

- `get_stripe_account_info`
- `retrieve_balance`
- `list_coupons`
- `list_customers`
- `list_disputes`
- `list_invoices`
- `list_payment_intents`
- `list_prices`
- `list_products`
- `list_subscriptions`
- `search_stripe_resources`
- `fetch_stripe_resources`
- `search_stripe_documentation`

Read-only tools may run without confirmation after confirming the active Stripe account
and whether the task is in sandbox or live mode.

Treat these tools as writes:

- `create_coupon`
- `create_customer`
- `update_dispute`
- `create_invoice`
- `create_invoice_item`
- `finalize_invoice`
- `create_payment_link`
- `create_price`
- `create_product`
- `create_refund`
- `cancel_subscription`
- `update_subscription`

For Samo/Katarina, disable all write tools, including `create_refund`. Their Stripe MCP
access is read-only by default. If a write operation is needed later, Neža can enable
the specific tool temporarily and supervise the action.

## What Samo/Katarina Can Safely Ask

Good prompts:

```text
Use Stripe MCP. Show the latest 10 successful payments.
```

The prompt must name the account when there is any ambiguity:

```text
Use Stripe MCP with the ŠD Apnea Slovenija account. Show the latest 10 successful
training membership payments. Do not change anything.
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

Stripe MCP is read-only for Samo/Katarina, so refunds must be completed by an authorized
operator in the Stripe Dashboard or after Neža temporarily enables `create_refund`.

Workflow:

1. Find the payment.
2. Show amount, customer, date, product/course, and metadata.
3. Ask the user to confirm the refund.
4. Only then create the refund.
5. After refunding, explain that Brevo/customer communication may still need to be sent manually.

Do not promise automatic accounting treatment. Stripe receipts are not the same thing
as Slovenian accounting invoices; Samo’s accountant / Zoho Books decision is separate.

## Webhooks

Production training emails only work if Stripe has a webhook endpoint configured:

```text
Trainings: https://<production-domain>/api/stripe/training-webhook
```

Do not configure the course/voucher production webhook for launch unless Neža explicitly
revives those Stripe flows. The dormant endpoint is:

```text
Courses/vouchers: https://<production-domain>/api/stripe/webhook
```

Required event:

```text
payment_intent.succeeded
```

Vercel must have the matching:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Each account and mode has its own webhook secret:

- `STRIPE_WEBHOOK_SECRET`
- `TRAINING_STRIPE_WEBHOOK_SECRET`

Test mode and live mode have different webhook secrets.

## Live Mode Rules

Before launch, the only public Stripe live-mode setup is for the ŠD Apnea Slovenija
training account.

For the Samo Jeranko s.p. account, course and gift-voucher Stripe flows are deferred.
Only do the following later if Neža explicitly revives online payment for those flows:

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

For the ŠD Apnea Slovenija account before launch:

1. Confirm the live training membership price created by the PaymentIntent flow.
2. Replace Vercel env vars:
   - `TRAINING_STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY`
   - `TRAINING_STRIPE_WEBHOOK_SECRET`
3. Redeploy Vercel.
4. Run one real low-risk membership payment test if Samo approves.

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
- Do not search or act without confirming the active Stripe account.
- Do not change live products/prices without Neža.
- Do not register or delete webhooks casually.
- Do not refund without explicit confirmation.
- Do not treat Stripe receipts as final Slovenian invoice policy.
