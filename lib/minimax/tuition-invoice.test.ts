import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { issueTuitionInvoice, tuitionInvoicePayload } from "./tuition-invoice";
import { getInvoicePdf } from "./training-invoice";
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
    visible = false,
    issued = false,
    creates = 0,
    issueActions = 0;
  let payload: Record<string, unknown> = {};
  let mismatch: Record<string, unknown> = {};
  let createResponse = "lost";
  let duplicate = false;
  let loseIssueResponse = false;
  let attachmentMode = "official";
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
        return json({
          Rows: accepted && visible
            ? Array.from({ length: duplicate ? 2 : 1 }, () => ({ IssuedInvoiceId: 123 }))
            : [],
        });
      if (path.endsWith("/issuedinvoices") && init?.method === "POST") {
        creates++;
        accepted = true;
        payload = JSON.parse(String(init.body));
        if (createResponse === "empty") return new Response(null, { status: 201 });
        if (createResponse === "missing-id") return json({});
        throw new Error("Response lost after Minimax accepted create");
      }
      if (path.includes("/actions/issueAndGeneratepdf")) {
        issued = true;
        issueActions++;
        if (loseIssueResponse) throw new Error("Issue response lost");
        return new Response(null, { status: 204 });
      }
      if (path.endsWith("/issuedinvoices/123"))
        return json({
          ...payload,
          IssuedInvoiceId: 123,
          DocumentReference: payment.id,
          Status: issued ? "I" : "O",
          PaymentStatus: issued ? "Placan" : "Osnutek",
          InvoiceValue: issued ? 325 : 0,
          InvoiceForPeriod: "N",
          IssuedInvoiceRows: (payload.IssuedInvoiceRows as object[]).map(row => ({
            ...row, Value: 325,
          })),
          PaidValue: issued ? 325 : 0,
          InvoiceAttachment: issued
            ? {
                ID: 456,
                ResourceUrl: "/api/orgs/241557/attachments/456",
              }
            : undefined,
          RowVersion: "version",
          InvoiceNumber: 1,
          Year: 2026,
          ...mismatch,
        });
      if (path.endsWith("/issuedinvoices/123/attachments")) {
        const official = {
          AttachmentId: 456,
          AttachmentData: Buffer.from("%PDF-synthetic").toString("base64"),
          AttachmentFileName: "racun.pdf",
        };
        return json([
          {
            AttachmentId: 999,
            AttachmentData: Buffer.from("%PDF-unrelated").toString("base64"),
            AttachmentFileName: "unrelated.pdf",
          },
          ...(attachmentMode === "missing" ? [] : [official]),
          ...(attachmentMode === "duplicate" ? [official] : []),
        ]);
      }
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
  await assert.rejects(
    () => issueTuitionInvoice(plan, payment, save),
    /Previous Minimax creation outcome is unknown/,
  );
  assert.equal(creates, 1);
  visible = true;
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
    { InvoiceForPeriod: undefined },
    { InvoiceForPeriod: "invalid" },
    { Rabate: 10 },
    { IssuedInvoiceRows: [] },
    ...[
      { Item: { ID: 99 } },
      { Price: 300 },
      { VATPercent: 22 },
      { VatRate: { ID: 99 } },
      { Description: "wrong instalment" },
      { Quantity: 2 },
      { DiscountPercent: 10 },
      { Value: 300 },
      { Value: undefined },
    ].map((change) => ({
      IssuedInvoiceRows: [
        { ...(payload.IssuedInvoiceRows as object[])[0], Value: 325, ...change },
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
  // Ambiguous references never authorize issuing either document.
  payment.minimax_id = null;
  duplicate = true;
  await assert.rejects(
    () => issueTuitionInvoice(plan, payment, save),
    /Duplicate Minimax/,
  );
  assert.equal(issueActions, 0);
  duplicate = false;
  const result = await issueTuitionInvoice(plan, payment, save);
  assert.equal(creates, 1);
  assert.equal(issueActions, 1);
  assert.equal(result.invoiceId, 123);
  assert.equal(Buffer.from(result.pdf.contentBase64, "base64").toString(), "%PDF-synthetic");
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
  // Final totals/paid status remain strict even when a draft was acceptable.
  for (const mutation of [
    { InvoiceValue: 0 },
    { InvoiceValue: undefined },
    { PaidValue: 0 },
    { PaymentStatus: "NeplacanNezapadel" },
  ]) {
    mismatch = mutation;
    await assert.rejects(
      () => issueTuitionInvoice(plan, payment, save),
      /differs from approved|not verified issued/,
    );
  }
  mismatch = {};
  // Both provider response forms recover immediately in the same execution.
  for (const response of ["empty", "missing-id", "lost"]) {
    createResponse = response;
    accepted = false;
    issued = false;
    payment.invoice_state = "pending";
    payment.minimax_id = null;
    const previousCreates: number = creates;
    const previousIssues: number = issueActions;
    await issueTuitionInvoice(plan, payment, save);
    assert.equal(creates, previousCreates + 1);
    assert.equal(issueActions, previousIssues + 1);
    await issueTuitionInvoice(plan, payment, save);
    assert.equal(creates, previousCreates + 1);
    assert.equal(issueActions, previousIssues + 1);
  }
  issued = false;
  loseIssueResponse = true;
  const issuesBeforeLostResponse: number = issueActions;
  await assert.rejects(
    () => issueTuitionInvoice(plan, payment, save),
    /Issue response lost/,
  );
  loseIssueResponse = false;
  await issueTuitionInvoice(plan, payment, save);
  assert.equal(issueActions, issuesBeforeLostResponse + 1);
  attachmentMode = "missing";
  assert.equal(await getInvoicePdf({
    organisationId: 241557, issuedInvoiceId: 123, invoiceOnly: true,
  }), undefined, "An unrelated uploaded PDF cannot replace the official invoice");
  attachmentMode = "duplicate";
  await assert.rejects(
    () => getInvoicePdf({ organisationId: 241557, issuedInvoiceId: 123, invoiceOnly: true }),
    /Ambiguous official/,
  );
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
