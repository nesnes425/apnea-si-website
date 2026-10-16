import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { issueTuitionInvoice, tuitionInvoicePayload } from "./tuition-invoice";
import { planSchema } from "../tuition/plan";
import type { PaymentRecord } from "../tuition/store";

test("Minimax bridge resumes an accepted invoice after a lost response and verifies paid status", async (t) => {
  const settings: Record<string, string> = {
    MINIMAX_API_BASE: "https://minimax.invalid/si/api",
    MINIMAX_AUTH_URL: "https://minimax.invalid/token",
    MINIMAX_CLIENT_ID: "synthetic",
    MINIMAX_CLIENT_SECRET: "synthetic",
    MINIMAX_USERNAME: "synthetic",
    MINIMAX_PASSWORD: "synthetic",
    MINIMAX_TUITION_ENABLED: "true",
    MINIMAX_TUITION_POLICY: "service_per_instalment",
    MINIMAX_TUITION_VAT_PERCENT: "0",
    MINIMAX_TUITION_VAT_CLAUSE:
      "DDV ni obračunan skladno z 12. točko 1. odstavka 42. člena ZDDV-1.",
    MINIMAX_TUITION_DOCUMENT_NUMBERING_ID: "8",
    MINIMAX_TUITION_VAT_RATE_ID: "3",
    TUITION_ITEMS_JSON: JSON.stringify({
      "TEST-POOL": { stripeProductId: "prod_synthetic", minimaxItemId: 2 },
    }),
    MINIMAX_TRAINING_ORGANISATION_ID: "241557",
    MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID: "4",
    MINIMAX_TRAINING_CURRENCY_ID: "5",
    MINIMAX_TRAINING_REPORT_TEMPLATE_ID: "6",
    MINIMAX_TRAINING_PAYMENT_METHOD_ID: "7",
  };
  const previous = Object.fromEntries(
    Object.keys(settings).map((k) => [k, process.env[k]]),
  );
  Object.assign(process.env, settings);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const plan = {
    ...planSchema.parse(
      JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8")),
    ),
    mode: "live" as const,
  };
  const payment: PaymentRecord = {
    id: "pi_synthetic_resume",
    plan_id: plan.id,
    instalment: 1,
    amount_cents: 32500,
    paid_at: "2026-10-16T08:00:00Z",
    invoice_state: "pending",
    minimax_id: null,
    email_state: "pending",
    email_key: "synthetic",
    error: null,
  };
  let accepted = false,
    issued = false,
    creates = 0,
    issueActions = 0;
  let payload: Record<string, unknown> = {};
  let mismatch: Record<string, unknown> = {};
  const mockFetch = t.mock.method(
    globalThis,
    "fetch",
    async (url: string | URL | Request, init?: RequestInit) => {
      const path = String(url);
      const json = (body: unknown) =>
        new Response(JSON.stringify(body), { status: 200 });
      if (path.endsWith("/token"))
        return json({ access_token: "synthetic", expires_in: 300 });
      if (path.includes("/customers/code(")) return json({ CustomerId: 10 });
      if (path.includes("/issuedinvoices?"))
        return json({ Rows: accepted ? [{ IssuedInvoiceId: 123 }] : [] });
      if (path.endsWith("/issuedinvoices") && init?.method === "POST") {
        creates++;
        accepted = true;
        payload = JSON.parse(String(init.body));
        throw new Error("Response lost after Minimax accepted create");
      }
      if (path.includes("/actions/issueAndGeneratepdf")) {
        issued = true;
        issueActions++;
        return new Response(null, { status: 204 });
      }
      if (path.endsWith("/issuedinvoices/123"))
        return json({
          ...payload,
          IssuedInvoiceId: 123,
          DocumentReference: payment.id,
          Status: issued ? "I" : "O",
          PaymentStatus: issued ? "Placan" : "Osnutek",
          InvoiceValue: 325,
          PaidValue: issued ? 325 : 0,
          InvoiceAttachment: issued
            ? {
                AttachmentData:
                  Buffer.from("%PDF-synthetic").toString("base64"),
                AttachmentFileName: "racun.pdf",
              }
            : undefined,
          RowVersion: "version",
          InvoiceNumber: 1,
          Year: 2026,
          ...mismatch,
        });
      if (path.endsWith("/issuedinvoices/123/attachments"))
        return json([
          {
            AttachmentData: Buffer.from("%PDF-synthetic").toString("base64"),
            AttachmentFileName: "racun.pdf",
          },
        ]);
      throw new Error(`Unexpected synthetic request: ${path}`);
    },
  );
  const save = async (patch: Partial<PaymentRecord>) => {
    Object.assign(payment, patch);
  };
  await assert.rejects(
    () => issueTuitionInvoice(plan, payment, save),
    /Response lost/,
  );
  assert.equal(payment.invoice_state, "creating");
  const mutations = [
    { InvoiceValue: 300 },
    { InvoiceValue: undefined },
    { Customer: undefined },
    { Customer: { ID: 99 } },
    { Currency: { ID: 99 } },
    { DocumentNumbering: { ID: 99 } },
    { DateTransactionFrom: "2026-10-06" },
    { DateTransaction: "2027-06-15" },
    { DescriptionBelow: "wrong clause" },
    { InvoiceType: "P" },
    { IssuedInvoiceRows: [] },
    ...[
      { Item: { ID: 99 } },
      { Price: 300 },
      { VATPercent: 22 },
      { VatRate: { ID: 99 } },
      { Description: "wrong instalment" },
      { Quantity: 2 },
      { DiscountPercent: 10 },
    ].map((change) => ({
      IssuedInvoiceRows: [
        { ...(payload.IssuedInvoiceRows as object[])[0], ...change },
      ],
    })),
    { IssuedInvoicePaymentMethods: [] },
  ];
  for (const mutation of mutations) {
    mismatch = mutation;
    await assert.rejects(
      () => issueTuitionInvoice(plan, payment, save),
      /mismatch|differs from approved/,
    );
    assert.equal(issueActions, 0, JSON.stringify(mutation));
    assert.equal(creates, 1);
  }
  mismatch = {};
  const result = await issueTuitionInvoice(plan, payment, save);
  assert.equal(creates, 1);
  assert.equal(issueActions, 1);
  assert.equal(result.invoiceId, 123);
  assert.equal(payment.invoice_state, "issued");
  assert.equal(payload.DateTransactionFrom, "2026-10-05");
  assert.equal(payload.DateTransaction, "2027-06-14");
  assert.equal(payload.DocumentReference, payment.id);
  assert.deepEqual(payload.DocumentNumbering, { ID: 8 });
  assert.equal(process.env.MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID, "4");
  for (const instalment of [1, 2] as const) {
    const part = instalment === 1 ? plan.first : plan.second!;
    const draft = tuitionInvoicePayload(
      plan,
      { ...payment, instalment, amount_cents: part.amountCents },
      10,
    );
    assert.ok(
      draft.DescriptionBelow.includes(settings.MINIMAX_TUITION_VAT_CLAUSE),
    );
    assert.equal(draft.IssuedInvoiceRows[0].VATPercent, 0);
    assert.equal(draft.IssuedInvoiceRows[0].Price, part.amountCents / 100);
  }
  assert.equal(
    (
      payload.IssuedInvoicePaymentMethods as {
        AlreadyPaid: string;
        Amount: number;
      }[]
    )[0].AlreadyPaid,
    "D",
  );
  await issueTuitionInvoice(plan, payment, save);
  assert.equal(creates, 1);
  assert.equal(issueActions, 1);
  mockFetch.mock.restore();
});

test("a test-mode Stripe plan is refused before Minimax access", async () => {
  const plan = planSchema.parse(
    JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8")),
  );
  await assert.rejects(
    () => issueTuitionInvoice(plan, {} as PaymentRecord, async () => {}),
    /never create real Minimax/,
  );
});
