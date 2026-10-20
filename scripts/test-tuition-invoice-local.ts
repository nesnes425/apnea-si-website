// Local HTTP acceptance test: real adapters, synthetic providers and payer only.
// No environment files, external requests, accounting records or email delivery.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import { planSchema } from "../lib/tuition/plan";
import { issueTuitionInvoice } from "../lib/minimax/tuition-invoice";
import { processTuitionPayment, tuitionReceiptText } from "../lib/tuition/processor";
import { sendTransactionalEmail } from "../lib/brevo/client";
import type { PaymentRecord } from "../lib/tuition/store";

async function main() {
  const plan = {
    ...planSchema.parse(JSON.parse(readFileSync("scripts/tuition-plan.example.json", "utf8"))),
    mode: "live" as const,
  };
  const payment: PaymentRecord = {
    id: "pi_local_synthetic", plan_id: plan.id, instalment: 1,
    amount_cents: 32500, paid_at: "2026-10-20T12:00:00Z",
    invoice_state: "pending", minimax_id: null, email_state: "pending",
    email_key: "c046a3d1-9df7-4c9c-81c5-50b31cd7673f", error: null,
  };
  let accepted = false, issued = false, creates = 0, issues = 0, emails = 0;
  let draft: Record<string, unknown> = {};
  let requestFailure: unknown;
  const pdf = Buffer.from("%PDF-local-synthetic").toString("base64");
  const server = createServer(async (req, res) => {
    try {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw.startsWith("{") ? raw : "{}") : {};
      const path = req.url!;
      const json = (value: unknown) => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(value));
      };
      if (path === "/token") return json({ access_token: "synthetic", expires_in: 300 });
      if (path.includes("/customers/code(")) return json({ CustomerId: 10 });
      if (path.includes("/issuedinvoices?"))
        return json({ Rows: accepted ? [{ IssuedInvoiceId: 123 }] : [] });
      if (path.endsWith("/issuedinvoices") && req.method === "POST") {
        assert.equal(accepted, false, "Never create a second document");
        creates++;
        accepted = true;
        draft = body;
        res.statusCode = 201;
        return res.end(); // Accepted creation with no invoice object.
      }
      if (path.includes("/actions/issueAndGeneratepdf")) {
        issues++;
        assert.equal(issued, false);
        assert.equal(payment.minimax_id, 123);
        issued = true;
        res.statusCode = 204;
        return res.end();
      }
      if (path.endsWith("/issuedinvoices/123")) return json({
        ...draft,
        IssuedInvoiceId: 123, RowVersion: "synthetic-version",
        Status: issued ? "I" : "O", PaymentStatus: issued ? "Placan" : "Osnutek",
        InvoiceValue: issued ? 325 : 0, PaidValue: issued ? 325 : 0,
        InvoiceForPeriod: "N", Rabate: 0,
        IssuedInvoiceRows: (draft.IssuedInvoiceRows as object[]).map(row => ({ ...row, Value: 325 })),
        InvoiceNumber: issued ? 1 : null, Year: issued ? 2026 : null,
        InvoiceAttachment: issued ? { AttachmentData: pdf, AttachmentFileName: "synthetic.pdf" } : undefined,
      });
      if (path === "/smtp/email") {
        assert.equal(issued, true);
        assert.equal(payment.invoice_state, "issued");
        assert.equal(payment.email_state, "sending");
        assert.deepEqual(body.to, [{ email: plan.payer.email, name: plan.payer.name }]);
        assert.equal(body.attachment[0].content, pdf);
        assert.equal(body.headers.idempotencyKey, payment.email_key);
        assert.match(body.textContent, /325/);
        emails++;
        return json({ messageId: "<local-only@example.invalid>" });
      }
      throw new Error(`Unexpected local request: ${req.method} ${path}`);
    } catch (error) {
      requestFailure = error;
      res.statusCode = 500;
      res.end("Synthetic provider assertion failed");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const nativeFetch = globalThis.fetch;
  const settings = {
    MINIMAX_API_BASE: origin, MINIMAX_AUTH_URL: `${origin}/token`,
    MINIMAX_CLIENT_ID: "synthetic", MINIMAX_CLIENT_SECRET: "synthetic",
    MINIMAX_USERNAME: "synthetic", MINIMAX_PASSWORD: "synthetic",
    MINIMAX_TUITION_ENABLED: "true", MINIMAX_TUITION_POLICY: "service_per_instalment",
    MINIMAX_TUITION_VAT_PERCENT: "0", MINIMAX_TUITION_VAT_CLAUSE: "Synthetic exemption",
    MINIMAX_TUITION_DOCUMENT_NUMBERING_ID: "8", MINIMAX_TUITION_VAT_RATE_ID: "3",
    TUITION_ITEMS_JSON: JSON.stringify({ "TEST-POOL": { stripeProductId: "prod_synthetic", minimaxItemId: 2 } }),
    MINIMAX_TRAINING_ORGANISATION_ID: "241557", MINIMAX_TRAINING_CURRENCY_ID: "5",
    MINIMAX_TRAINING_REPORT_TEMPLATE_ID: "6", MINIMAX_TRAINING_PAYMENT_METHOD_ID: "7",
    BREVO_API_KEY: "synthetic", BREVO_FROM_EMAIL: "sender@example.invalid", BREVO_FROM_NAME: "Local test",
  };
  Object.assign(process.env, settings);
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.href === "https://api.brevo.com/v3/smtp/email")
      return nativeFetch(`${origin}/smtp/email`, init);
    assert.equal(url.origin, origin, "External network access forbidden");
    return nativeFetch(input, init);
  };
  try {
    const save = async (patch: Partial<PaymentRecord>) => { Object.assign(payment, patch); };
    const process = () => processTuitionPayment(plan, payment, {
      save,
      issue: () => issueTuitionInvoice(plan, payment, save),
      send: invoice => {
        const text = tuitionReceiptText(plan, payment, invoice.number);
        return sendTransactionalEmail({
          to: { email: plan.payer.email, name: plan.payer.name },
          subject: "Synthetic invoice", text, html: text,
          idempotencyKey: payment.email_key,
          attachments: [{ name: invoice.pdf.fileName, contentBase64: invoice.pdf.contentBase64 }],
        });
      },
    });
    assert.equal(await process(), "sent");
    assert.equal(await process(), "sent");
    assert.deepEqual({ creates, issues, emails }, { creates: 1, issues: 1, emails: 1 });
    // Recover the same draft after a previous execution crashed before saving ID.
    issued = false;
    Object.assign(payment, { invoice_state: "creating", minimax_id: null, email_state: "pending" });
    assert.equal(await process(), "sent");
    assert.equal(await process(), "sent");
    assert.deepEqual({ creates, issues, emails }, { creates: 1, issues: 2, emails: 2 });
    if (requestFailure) throw requestFailure;
    console.log("PASS localhost: empty create response → verified draft → issued/paid → PDF → payer email; replay and orphan-draft recovery without duplicate creation.");
  } finally {
    globalThis.fetch = nativeFetch;
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
