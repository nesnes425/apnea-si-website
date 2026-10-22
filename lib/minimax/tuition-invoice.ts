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
  type MinimaxCustomer,
} from "./client";
import { getInvoicePdf } from "./training-invoice";

// Minimax club country catalogue verified read-only 22 October 2026: IT=106, SI=192.
// Keep the existing SI configuration; never apply its fallback to a foreign payer.
export function tuitionCountryId(country: TuitionPlan["payer"]["country"]) {
  if (country === "IT") return 106;
  if (country === "SI") return readOptionalEnvNumber("MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID") ?? 192;
  throw new Error("Unsupported tuition payer country");
}

// Minimax documents missing-data markers for a generic consumer. Keep them
// exclusively in this adapter; the real personal recipient stays in the plan.
export function tuitionBillingDetails(p: TuitionPlan) {
  return p.payer.accountingMode === "generic_consumer_address_omitted"
    ? {Name:"Fizična oseba/Kupec", Address:"/", PostalCode:"/", City:"/"}
    : {Name:p.payer.name, Address:p.payer.address, PostalCode:p.payer.postalCode, City:p.payer.city};
}
export function tuitionCustomerCode(p: TuitionPlan) {
  return `AP-T-${createHash("sha256").update(p.payerId).digest("hex").slice(0,16).toUpperCase()}`;
}
export function assertTuitionCustomerMatches(p: TuitionPlan, customer: MinimaxCustomer) {
  const wanted = tuitionBillingDetails(p);
  if ((p.payer.country === "IT" || p.payer.accountingMode) &&
      (customer.Country?.ID !== tuitionCountryId(p.payer.country) ||
       customer.Name !== wanted.Name || customer.Address !== wanted.Address ||
       customer.PostalCode !== wanted.PostalCode || customer.City !== wanted.City ||
       (p.payer.accountingMode && customer.Code !== tuitionCustomerCode(p))))
    throw new Error("Minimax payer address differs; reconcile before invoicing");
}

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
  const billing = tuitionBillingDetails(p);
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
    AddresseeName: billing.Name,
    AddresseeAddress: billing.Address,
    AddresseePostalCode: billing.PostalCode,
    AddresseeCity: billing.City,
    AddresseeCountry: {
      ID: tuitionCountryId(p.payer.country),
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

// Drafts can report InvoiceValue=0 before issuance. Verify their actual row
// value and all approved inputs; require the provider's final total after issue.
export function assertTuitionInvoiceMatches(
  invoice: MinimaxIssuedInvoice,
  expected: ReturnType<typeof tuitionInvoicePayload>,
  amountCents: number,
) {
  const row = invoice.IssuedInvoiceRows?.[0];
  const wanted = expected.IssuedInvoiceRows[0];
  const method = invoice.IssuedInvoicePaymentMethods?.[0];
  const cents = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) ? Math.round(n * 100) : NaN;
  if (
    !["O", "I"].includes(invoice.Status ?? "") ||
    invoice.DocumentReference !== expected.DocumentReference ||
    invoice.Customer?.ID !== expected.Customer.ID ||
    invoice.AddresseeCountry?.ID !== expected.AddresseeCountry.ID ||
    invoice.AddresseeName !== expected.AddresseeName ||
    invoice.AddresseeAddress !== expected.AddresseeAddress ||
    invoice.AddresseePostalCode !== expected.AddresseePostalCode ||
    invoice.AddresseeCity !== expected.AddresseeCity ||
    invoice.Currency?.ID !== expected.Currency.ID ||
    invoice.DocumentNumbering?.ID !== expected.DocumentNumbering.ID ||
    (invoice.Status === "I"
      ? cents(invoice.InvoiceValue) !== amountCents
      : cents(row?.Value) !== amountCents ||
        ![0, amountCents].includes(cents(invoice.InvoiceValue))) ||
    (invoice.Rabate ?? 0) !== 0 ||
    invoice.DateTransactionFrom?.slice(0, 10) !==
      expected.DateTransactionFrom ||
    invoice.DateTransaction?.slice(0, 10) !== expected.DateTransaction ||
    invoice.DescriptionBelow?.replace(/\r\n/g, "\n") !==
      expected.DescriptionBelow ||
    invoice.InvoiceType !== expected.InvoiceType ||
    invoice.PricesOnInvoice !== expected.PricesOnInvoice ||
    // Minimax returns N for the observed API-created period invoice despite D
    // in the payload. The exact two service dates and row description above/below
    // remain mandatory; this flag alone is not evidence of the service period.
    !["D", "N"].includes(invoice.InvoiceForPeriod ?? "") ||
    invoice.IssuedInvoiceRows?.length !== 1 ||
    row?.Item?.ID !== wanted.Item.ID ||
    row.ItemName !== wanted.ItemName ||
    row.Description !== wanted.Description ||
    row.Quantity !== 1 ||
    cents(row.Price) !== amountCents ||
    row.VATPercent !== 0 ||
    row.VatRate?.ID !== wanted.VatRate.ID ||
    (row.DiscountPercent ?? 0) !== 0 ||
    (row.Discount ?? 0) !== 0 ||
    invoice.IssuedInvoicePaymentMethods?.length !== 1 ||
    method?.PaymentMethod?.ID !==
      expected.IssuedInvoicePaymentMethods[0].PaymentMethod.ID ||
    cents(method.Amount) !== amountCents ||
    method.AlreadyPaid !== "D"
  )
    throw new Error(
      "Minimax document differs from approved tuition; reconcile before issuing or sending",
    );
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
  const code = tuitionCustomerCode(p);
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
        ...tuitionBillingDetails(p),
        Country: {
          ID: tuitionCountryId(p.payer.country),
        },
        Currency: { ID: id("MINIMAX_TRAINING_CURRENCY_ID") },
        SubjectToVAT: "N",
        Usage: "D",
        EInvoiceIssuing: "SeNePripravlja",
      },
    });
  }
  // A POST may return only an ID. Verify foreign and explicit generic-consumer
  // customer identity/address via GET before creating any invoice.
  if (p.payer.country === "IT" || p.payer.accountingMode) {
    const persisted = await getCustomerByCode({organisationId, code});
    if (!persisted) throw new Error("Minimax payer verification unavailable");
    customer = persisted;
  }
  assertTuitionCustomerMatches(p, customer);
  let invoice = payment.minimax_id
    ? await getIssuedInvoice({
        organisationId,
        issuedInvoiceId: payment.minimax_id,
      })
    : await findByReference(organisationId, customer.CustomerId, payment.id);
  if (invoice && invoice.DocumentReference !== payment.id)
    throw new Error("Stored Minimax document reference mismatch");
  if (invoice && invoice.Customer?.ID !== customer.CustomerId)
    throw new Error("Minimax payer mismatch");
  if (!invoice) {
    if (payment.invoice_state !== "pending")
      throw new Error(
        "Previous Minimax creation outcome is unknown; do not create another invoice",
      );
    // Persist BEFORE create: a crash/timeout can never cause a blind second POST.
    await save({ invoice_state: "creating" });
    let created;
    try {
      created = await createIssuedInvoice({
        organisationId,
        issuedInvoice: tuitionInvoicePayload(p, payment, customer.CustomerId),
      });
    } catch (error) {
      // An accepted POST may return no usable body or lose its response. Read
      // back the exact reference; never repeat POST to discover its outcome.
      const recovered = await findByReference(
        organisationId,
        customer.CustomerId,
        payment.id,
      );
      if (!recovered) throw error;
      created = { issuedInvoiceId: recovered.IssuedInvoiceId };
    }
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
  const expected = tuitionInvoicePayload(p, payment, customer.CustomerId);
  assertTuitionInvoiceMatches(invoice, expected, payment.amount_cents);
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
  assertTuitionInvoiceMatches(invoice, expected, payment.amount_cents);
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
