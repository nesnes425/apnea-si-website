import { createHash } from "node:crypto";
import { readEnv, readEnvNumber, readOptionalEnvNumber } from "@/lib/env";
import { tuitionItem, type TuitionPlan } from "@/lib/tuition/plan";
import type { PaymentRecord } from "@/lib/tuition/store";
import {
  createCustomer,
  createIssuedInvoice,
  getCustomerByCode,
  getIssuedInvoice,
  listIssuedInvoices,
  runIssuedInvoiceAction,
  type MinimaxIssuedInvoice,
} from "./client";
import { getInvoicePdf } from "./training-invoice";

function id(name: string) {
  const value = readEnvNumber(name);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`Invalid ${name}`);
  return value;
}
function localDay(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
  }).format(new Date(value));
}
export function tuitionInvoicePayload(
  p: TuitionPlan,
  payment: PaymentRecord,
  customerId: number,
) {
  if (id("MINIMAX_TRAINING_ORGANISATION_ID") !== 241557)
    throw new Error("Wrong Minimax organisation for club tuition");
  const service = payment.instalment === 1 ? p.first : p.second;
  if (!service || payment.amount_cents !== service.amountCents)
    throw new Error("Instalment does not match approved invoice");
  // The current club configuration is exempt. A non-zero tax treatment needs a
  // reviewed gross/net implementation rather than silently increasing the bill.
  if (readEnv("MINIMAX_TUITION_VAT_PERCENT") !== "0")
    throw new Error(
      "Only the approved zero-VAT tuition configuration is supported",
    );
  const amount = payment.amount_cents / 100;
  const paidDay = localDay(payment.paid_at);
  const issuedDay = localDay(new Date().toISOString());
  const vatRateId = id("MINIMAX_TUITION_VAT_RATE_ID");
  const itemId = tuitionItem(p.locationCode).minimaxItemId;
  if (!itemId)
    throw new Error("Missing Minimax tuition item for the approved location");
  return {
    DocumentNumbering: {
      ID: id(
        process.env.MINIMAX_TUITION_DOCUMENT_NUMBERING_ID
          ? "MINIMAX_TUITION_DOCUMENT_NUMBERING_ID"
          : "MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID",
      ),
    },
    Customer: { ID: customerId },
    DateIssued: issuedDay,
    DateTransactionFrom: service.serviceFrom,
    DateTransaction: service.serviceTo,
    DateDue: issuedDay,
    AddresseeName: p.payer.name,
    AddresseeAddress: p.payer.address,
    AddresseePostalCode: p.payer.postalCode,
    AddresseeCity: p.payer.city,
    AddresseeCountry: {
      ID: readOptionalEnvNumber("MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID") ?? 192,
    },
    DocumentReference: payment.id,
    Currency: { ID: id("MINIMAX_TRAINING_CURRENCY_ID") },
    IssuedInvoiceReportTemplate: {
      ID: id("MINIMAX_TRAINING_REPORT_TEMPLATE_ID"),
    },
    ...(process.env.MINIMAX_TRAINING_EMPLOYEE_ID
      ? { Employee: { ID: id("MINIMAX_TRAINING_EMPLOYEE_ID") } }
      : {}),
    PricesOnInvoice: "N",
    RecurringInvoice: "N",
    InvoiceForPeriod: "D",
    InvoiceType: "R",
    AssociationWithStock: "N",
    DescriptionBelow: `Plačano s kartico prek Stripe dne ${paidDay}.\n${readEnv("MINIMAX_TUITION_VAT_CLAUSE")}`,
    Notes: `Vadnina; plan ${p.id}; Stripe ${payment.id}; potrdil ${p.approval.approvedBy}.`,
    IssuedInvoiceRows: [
      {
        Item: { ID: itemId },
        ItemName: p.description,
        Description: `${p.participant}; ${payment.instalment}. obrok; ${service.serviceFrom}–${service.serviceTo}`,
        Quantity: 1,
        UnitOfMeasurement: "kos",
        Price: amount,
        VATPercent: 0,
        VatRate: { ID: vatRateId },
      },
    ],
    IssuedInvoicePaymentMethods: [
      {
        PaymentMethod: { ID: id("MINIMAX_TRAINING_PAYMENT_METHOD_ID") },
        ...(process.env.MINIMAX_TRAINING_CASH_REGISTER_ID
          ? { CashRegister: { ID: id("MINIMAX_TRAINING_CASH_REGISTER_ID") } }
          : {}),
        ...(process.env.MINIMAX_TRAINING_REVENUE_ID
          ? { Revenue: { ID: id("MINIMAX_TRAINING_REVENUE_ID") } }
          : {}),
        RevenueDate: paidDay,
        Amount: amount,
        AmountInDomesticCurrency: amount,
        AlreadyPaid: "D",
      },
    ],
  };
}

export function assertIssuedAndPaid(
  invoice: MinimaxIssuedInvoice,
  amountCents: number,
  reference: string,
) {
  if (
    invoice.DocumentReference !== reference ||
    invoice.Status !== "I" ||
    invoice.PaymentStatus !== "Placan" ||
    Math.round(Number(invoice.InvoiceValue) * 100) !== amountCents ||
    Math.round(Number(invoice.PaidValue) * 100) !== amountCents
  )
    throw new Error(
      "Minimax invoice is not verified issued and fully paid for this instalment",
    );
}

async function findByReference(
  organisationId: number,
  customerId: number,
  reference: string,
) {
  const matches: MinimaxIssuedInvoice[] = [];
  for (let page = 1; page <= 100; page++) {
    const rows = await listIssuedInvoices({
      organisationId,
      invoiceType: "R",
      customerId,
      currentPage: page,
      pageSize: 100,
    });
    for (const row of rows) {
      const invoice = await getIssuedInvoice({
        organisationId,
        issuedInvoiceId: row.IssuedInvoiceId,
      });
      if (invoice.DocumentReference === reference) matches.push(invoice);
    }
    if (rows.length < 100) {
      if (matches.length > 1)
        throw new Error("Duplicate Minimax references require reconciliation");
      return matches[0];
    }
  }
  throw new Error("Minimax search incomplete; refusing to create an invoice");
}

export async function issueTuitionInvoice(
  p: TuitionPlan,
  payment: PaymentRecord,
  save: (patch: Partial<PaymentRecord>) => Promise<void>,
) {
  if (p.mode !== "live")
    throw new Error(
      "Test Stripe payments must never create real Minimax documents",
    );
  if (
    process.env.MINIMAX_TUITION_ENABLED !== "true" ||
    process.env.MINIMAX_TUITION_POLICY !== "service_per_instalment"
  )
    throw new Error("Tuition accounting configuration is not approved/enabled");
  // Validate all invoice settings before the first external mutation.
  tuitionInvoicePayload(p, payment, 1);
  const organisationId = id("MINIMAX_TRAINING_ORGANISATION_ID");
  const code = `AP-T-${createHash("sha256").update(p.payerId).digest("hex").slice(0, 16).toUpperCase()}`;
  let customer = await getCustomerByCode({ organisationId, code });
  if (!customer) {
    if (payment.invoice_state !== "pending")
      throw new Error(
        "Uncertain invoice/customer creation requires reconciliation",
      );
    customer = await createCustomer({
      organisationId,
      customer: {
        Code: code,
        Name: p.payer.name,
        Address: p.payer.address,
        PostalCode: p.payer.postalCode,
        City: p.payer.city,
        Country: {
          ID:
            readOptionalEnvNumber("MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID") ??
            192,
        },
        Currency: { ID: id("MINIMAX_TRAINING_CURRENCY_ID") },
        SubjectToVAT: "N",
        Usage: "D",
        EInvoiceIssuing: "SeNePripravlja",
      },
    });
  }
  let invoice = payment.minimax_id
    ? await getIssuedInvoice({
        organisationId,
        issuedInvoiceId: payment.minimax_id,
      })
    : await findByReference(organisationId, customer.CustomerId, payment.id);
  if (invoice && invoice.DocumentReference !== payment.id)
    throw new Error("Stored Minimax document reference mismatch");
  if (invoice?.Customer?.ID && invoice.Customer.ID !== customer.CustomerId)
    throw new Error("Minimax payer mismatch");
  if (!invoice) {
    if (payment.invoice_state !== "pending")
      throw new Error(
        "Previous Minimax creation outcome is unknown; do not create another invoice",
      );
    // Persist BEFORE create: a crash/timeout can never cause a blind second POST.
    await save({ invoice_state: "creating" });
    const created = await createIssuedInvoice({
      organisationId,
      issuedInvoice: tuitionInvoicePayload(p, payment, customer.CustomerId),
    });
    await save({
      minimax_id: created.issuedInvoiceId,
      invoice_state: "created",
    });
    invoice = await getIssuedInvoice({
      organisationId,
      issuedInvoiceId: created.issuedInvoiceId,
    });
  } else
    await save({
      minimax_id: invoice.IssuedInvoiceId,
      invoice_state: "created",
    });
  if (invoice.Status !== "I") {
    if (!invoice.RowVersion) throw new Error("Missing Minimax row version");
    await runIssuedInvoiceAction({
      organisationId,
      issuedInvoiceId: invoice.IssuedInvoiceId,
      rowVersion: invoice.RowVersion,
      actionName: "issueAndGeneratepdf",
    });
    invoice = await getIssuedInvoice({
      organisationId,
      issuedInvoiceId: invoice.IssuedInvoiceId,
    });
  }
  assertIssuedAndPaid(invoice, payment.amount_cents, payment.id);
  await save({ invoice_state: "issued", minimax_id: invoice.IssuedInvoiceId });
  let pdf = await getInvoicePdf({
    organisationId,
    issuedInvoiceId: invoice.IssuedInvoiceId,
    invoiceOnly: true,
  });
  if (!pdf && invoice.RowVersion) {
    await runIssuedInvoiceAction({
      organisationId,
      issuedInvoiceId: invoice.IssuedInvoiceId,
      rowVersion: invoice.RowVersion,
      actionName: "generatepdf",
    });
    pdf = await getInvoicePdf({
      organisationId,
      issuedInvoiceId: invoice.IssuedInvoiceId,
      invoiceOnly: true,
    });
  }
  if (
    !pdf ||
    !Buffer.from(pdf.contentBase64, "base64")
      .subarray(0, 5)
      .equals(Buffer.from("%PDF-"))
  )
    throw new Error("No valid Minimax PDF available; email held");
  return {
    invoiceId: invoice.IssuedInvoiceId,
    number: `${invoice.InvoiceNumber}/${invoice.Year}`,
    pdf,
  };
}
