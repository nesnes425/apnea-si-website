import { createHash } from "node:crypto";
import type Stripe from "stripe";
import {
  createCustomer,
  createIssuedInvoice,
  createItem,
  getCustomerByCode,
  getDocumentAttachment,
  getIssuedInvoice,
  getItemByCode,
  getResource,
  listIssuedInvoiceAttachments,
  listIssuedInvoices,
  runIssuedInvoiceAction,
  type MinimaxDocumentAttachment,
} from "@/lib/minimax/client";
import { readEnvNumber, readOptionalEnv, readOptionalEnvNumber } from "@/lib/env";

type TrainingInvoiceData = {
  program: string;
  venue: string;
  city: string;
  weekday: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
  membershipFee: number;
  paymentIntentId: string;
  paymentCreated: Date;
};

export type MinimaxTrainingInvoiceResult = {
  issuedInvoiceId: number;
  invoiceNumber?: string;
  fiscalized: false;
  pdf?: {
    fileName: string;
    contentBase64: string;
  };
};

export function isTrainingMinimaxInvoicingEnabled() {
  return readOptionalEnv("MINIMAX_TRAINING_INVOICING_ENABLED") === "true";
}

function invoiceAction(): "generatepdf" | "issueAndGeneratepdf" {
  const action = readOptionalEnv("MINIMAX_TRAINING_INVOICE_ACTION") ?? "generatepdf";
  if (action === "issueAndGeneratepdf") return action;
  return "generatepdf";
}

function invoiceNumberLabel(invoice: {
  year?: number;
  invoiceNumber?: number;
  issuedInvoiceId: number;
}) {
  if (invoice.year && invoice.invoiceNumber) {
    return `${invoice.invoiceNumber}/${invoice.year}`;
  }
  return String(invoice.issuedInvoiceId);
}

function fk(id: number | undefined) {
  return id ? { ID: id } : undefined;
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function customerCode(data: TrainingInvoiceData) {
  const key = data.customerEmail || `${data.customerName}-${data.customerPhone}`;
  const hash = createHash("sha256").update(key.toLowerCase()).digest("hex").slice(0, 12);
  return `APNEA-${hash.toUpperCase()}`;
}

async function findOrCreateTrainingCustomer(params: {
  organisationId: number;
  data: TrainingInvoiceData;
  currencyId: number | undefined;
  countryId: number | undefined;
}) {
  const code = customerCode(params.data);
  const existing = await getCustomerByCode({ organisationId: params.organisationId, code });
  if (existing) return existing;

  return createCustomer({
    organisationId: params.organisationId,
    customer: {
      Code: code,
      Name: params.data.customerName,
      Address: params.data.customerAddress,
      PostalCode: params.data.customerPostalCode,
      City: params.data.customerCity,
      Country: fk(params.countryId),
      Currency: fk(params.currencyId),
      SubjectToVAT: "N",
      Usage: "D",
      EInvoiceIssuing: "SeNePripravlja",
      ExpirationDays: 0,
    },
  });
}

async function findOrCreateTrainingItem(params: {
  organisationId: number;
  currencyId: number | undefined;
  vatRateId: number | undefined;
  membershipFee: number;
}) {
  const code = readOptionalEnv("MINIMAX_TRAINING_ITEM_CODE") ?? "APNEA-CLANARINA";
  const existing = await getItemByCode({ organisationId: params.organisationId, code });
  if (existing) return existing;

  return createItem({
    organisationId: params.organisationId,
    item: {
      Code: code,
      Name: "Letna članarina ŠD Apnea Slovenija",
      Description: "Letna članarina ŠD Apnea Slovenija",
      ItemType: "S",
      UnitOfMeasurement: "kos",
      Price: params.membershipFee,
      VatRate: fk(params.vatRateId),
      Currency: fk(params.currencyId),
      Usage: "D",
      SerialNumbers: "N",
      BatchNumbers: "N",
    },
  });
}

function buildIssuedInvoicePayload(data: TrainingInvoiceData, customerId: number, itemId: number) {
  const vatPercent = Number(readOptionalEnv("MINIMAX_TRAINING_VAT_PERCENT") ?? "0");
  if (!Number.isFinite(vatPercent)) {
    throw new Error("MINIMAX_TRAINING_VAT_PERCENT is not a valid number");
  }
  const recordPayment = readOptionalEnv("MINIMAX_TRAINING_RECORD_PAYMENT") === "true";

  const documentNumberingId = readEnvNumber("MINIMAX_TRAINING_DOCUMENT_NUMBERING_ID");
  const currencyId = readOptionalEnvNumber("MINIMAX_TRAINING_CURRENCY_ID");
  const reportTemplateId = readOptionalEnvNumber("MINIMAX_TRAINING_REPORT_TEMPLATE_ID");
  const paymentMethodId = readOptionalEnvNumber("MINIMAX_TRAINING_PAYMENT_METHOD_ID");
  const cashRegisterId = readOptionalEnvNumber("MINIMAX_TRAINING_CASH_REGISTER_ID");
  const revenueId = readOptionalEnvNumber("MINIMAX_TRAINING_REVENUE_ID");
  const vatRateId = readOptionalEnvNumber("MINIMAX_TRAINING_VAT_RATE_ID");
  const countryId = readOptionalEnvNumber("MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID") ?? 192;

  const issuedAt = data.paymentCreated.toISOString();
  const itemName = "Letna članarina ŠD Apnea Slovenija";
  const description = [
    `Program: ${data.program}`,
    `Skupina: ${data.venue}, ${data.city}, ${data.weekday} ${data.time}`,
    `Stripe PaymentIntent: ${data.paymentIntentId}`,
  ].join("\n");

  return {
    DocumentNumbering: { ID: documentNumberingId },
    Customer: { ID: customerId },
    DateIssued: issuedAt,
    DateTransaction: issuedAt,
    DateDue: issuedAt,
    AddresseeName: data.customerName,
    AddresseeAddress: data.customerAddress,
    AddresseePostalCode: data.customerPostalCode,
    AddresseeCity: data.customerCity,
    AddresseeCountry: fk(countryId),
    DocumentReference: data.paymentIntentId,
    Notes: [
      "Ustvarjeno samodejno iz Stripe testnega plačila.",
      "Davčno potrjevanje ni izvedeno v tej testni fazi.",
      `Kupec: ${data.customerName}, ${data.customerEmail}, ${data.customerPhone}`,
    ].join("\n"),
    Currency: fk(currencyId),
    IssuedInvoiceReportTemplate: fk(reportTemplateId),
    Status: "O",
    PricesOnInvoice: "N",
    RecurringInvoice: "N",
    InvoiceForPeriod: "N",
    InvoiceType: "R",
    PaymentStatus: "Osnutek",
    AssociationWithStock: "N",
    DescriptionBelow:
      "Plačano preko Stripe. Davčno potrjevanje bo omogočeno pred produkcijskim zagonom.",
    IssuedInvoiceRows: [
      {
        Item: { ID: itemId },
        ItemName: itemName,
        Description: description,
        Quantity: 1,
        UnitOfMeasurement: "kos",
        Price: data.membershipFee,
        VATPercent: vatPercent,
        VatRate: fk(vatRateId),
      },
    ],
    IssuedInvoicePaymentMethods: recordPayment && paymentMethodId
      ? [
          {
            PaymentMethod: { ID: paymentMethodId },
            CashRegister: fk(cashRegisterId),
            Revenue: fk(revenueId),
            RevenueDate: issuedAt,
            Amount: data.membershipFee,
            AmountInDomesticCurrency: data.membershipFee,
            AlreadyPaid: "D",
          },
        ]
      : undefined,
  };
}

async function findInvoiceByPaymentIntentReference(params: {
  organisationId: number;
  paymentIntentId: string;
  paymentCreated: Date;
}) {
  const from = new Date(params.paymentCreated);
  from.setDate(from.getDate() - 2);
  const to = new Date(params.paymentCreated);
  to.setDate(to.getDate() + 2);

  const candidates = await listIssuedInvoices({
    organisationId: params.organisationId,
    invoiceType: "R",
    dateIssuedFrom: isoDateOnly(from),
    dateIssuedTo: isoDateOnly(to),
    pageSize: 50,
  });

  for (const candidate of candidates) {
    const invoice = await getIssuedInvoice({
      organisationId: params.organisationId,
      issuedInvoiceId: candidate.IssuedInvoiceId,
    });
    if (invoice.DocumentReference === params.paymentIntentId) {
      return invoice;
    }
  }

  return undefined;
}

async function resolveAttachment(
  organisationId: number,
  attachment: MinimaxDocumentAttachment | undefined
): Promise<MinimaxDocumentAttachment | undefined> {
  if (!attachment) return undefined;
  if (attachment.AttachmentData) return attachment;

  if (attachment.ResourceUrl) {
    return getResource<MinimaxDocumentAttachment>(attachment.ResourceUrl);
  }

  const documentId = attachment.Document?.ID;
  const attachmentId = attachment.DocumentAttachmentId ?? attachment.ID;
  if (documentId && attachmentId) {
    return getDocumentAttachment({ organisationId, documentId, attachmentId });
  }

  return attachment;
}

async function getInvoicePdf(params: {
  organisationId: number;
  issuedInvoiceId: number;
}): Promise<{ fileName: string; contentBase64: string } | undefined> {
  const attachments = await listIssuedInvoiceAttachments(params);
  const invoicePdf = attachments.find((attachment) => attachment.AttachmentData);
  if (invoicePdf?.AttachmentData) {
    return {
      fileName:
        invoicePdf.AttachmentFileName ??
        invoicePdf.FileName ??
        `minimax-racun-${params.issuedInvoiceId}.pdf`,
      contentBase64: invoicePdf.AttachmentData,
    };
  }

  const invoice = await getIssuedInvoice(params);
  const attachment = await resolveAttachment(params.organisationId, invoice.InvoiceAttachment);
  if (!attachment?.AttachmentData) return undefined;

  return {
    fileName:
      attachment.AttachmentFileName ??
      attachment.FileName ??
      `minimax-racun-${params.issuedInvoiceId}.pdf`,
    contentBase64: attachment.AttachmentData,
  };
}

function dataFromIntent(
  intent: Stripe.PaymentIntent,
  membershipFee: number
): TrainingInvoiceData {
  return {
    program: intent.metadata.trainingProgram ?? "",
    venue: intent.metadata.trainingVenue ?? "",
    city: intent.metadata.trainingCity ?? "",
    weekday: intent.metadata.trainingWeekday ?? "",
    time: intent.metadata.trainingTime ?? "",
    customerName: intent.metadata.customerName ?? "",
    customerEmail: intent.metadata.customerEmail ?? "",
    customerPhone: intent.metadata.customerPhone ?? "",
    customerAddress:
      intent.metadata.customerAddress ??
      readOptionalEnv("MINIMAX_TRAINING_TEST_CUSTOMER_ADDRESS") ??
      "Naslov ni podan",
    customerPostalCode:
      intent.metadata.customerPostalCode ??
      readOptionalEnv("MINIMAX_TRAINING_TEST_CUSTOMER_POSTAL_CODE") ??
      "1000",
    customerCity:
      intent.metadata.customerCity ??
      readOptionalEnv("MINIMAX_TRAINING_TEST_CUSTOMER_CITY") ??
      "Ljubljana",
    membershipFee,
    paymentIntentId: intent.id,
    paymentCreated: new Date((intent.created ?? Math.floor(Date.now() / 1000)) * 1000),
  };
}

export async function createTrainingMinimaxInvoice(params: {
  intent: Stripe.PaymentIntent;
  membershipFee: number;
}): Promise<MinimaxTrainingInvoiceResult> {
  const organisationId = readEnvNumber("MINIMAX_TRAINING_ORGANISATION_ID");
  const currencyId = readOptionalEnvNumber("MINIMAX_TRAINING_CURRENCY_ID");
  const countryId = readOptionalEnvNumber("MINIMAX_TRAINING_CUSTOMER_COUNTRY_ID") ?? 192;
  const vatRateId = readOptionalEnvNumber("MINIMAX_TRAINING_VAT_RATE_ID");
  const existingInvoiceId = Number(params.intent.metadata.minimaxIssuedInvoiceId);
  const invoiceData = dataFromIntent(params.intent, params.membershipFee);

  let issuedInvoiceId: number;
  let rowVersion: string | undefined;
  let invoiceNumber: string | undefined;

  if (Number.isFinite(existingInvoiceId) && existingInvoiceId > 0) {
    const existing = await getIssuedInvoice({ organisationId, issuedInvoiceId: existingInvoiceId });
    issuedInvoiceId = existing.IssuedInvoiceId;
    rowVersion = existing.RowVersion;
    invoiceNumber = invoiceNumberLabel({
      issuedInvoiceId,
      year: existing.Year,
      invoiceNumber: existing.InvoiceNumber,
    });
  } else {
    const existingByReference = await findInvoiceByPaymentIntentReference({
      organisationId,
      paymentIntentId: invoiceData.paymentIntentId,
      paymentCreated: invoiceData.paymentCreated,
    });

    if (existingByReference) {
      issuedInvoiceId = existingByReference.IssuedInvoiceId;
      rowVersion = existingByReference.RowVersion;
      invoiceNumber = invoiceNumberLabel({
        issuedInvoiceId,
        year: existingByReference.Year,
        invoiceNumber: existingByReference.InvoiceNumber,
      });
    } else {
      const customer = await findOrCreateTrainingCustomer({
        organisationId,
        data: invoiceData,
        currencyId,
        countryId,
      });
      const item = await findOrCreateTrainingItem({
        organisationId,
        currencyId,
        vatRateId,
        membershipFee: params.membershipFee,
      });
      let created;
      try {
        created = await createIssuedInvoice({
          organisationId,
          issuedInvoice: buildIssuedInvoicePayload(invoiceData, customer.CustomerId, item.ItemId),
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Minimax response did not include IssuedInvoiceId")
        ) {
          const createdByReference = await findInvoiceByPaymentIntentReference({
            organisationId,
            paymentIntentId: invoiceData.paymentIntentId,
            paymentCreated: invoiceData.paymentCreated,
          });
          if (createdByReference) {
            created = {
              issuedInvoiceId: createdByReference.IssuedInvoiceId,
              rowVersion: createdByReference.RowVersion,
              year: createdByReference.Year,
              invoiceNumber: createdByReference.InvoiceNumber,
            };
          }
        }
        if (!created) throw error;
      }
      issuedInvoiceId = created.issuedInvoiceId;
      rowVersion = created.rowVersion;
      invoiceNumber = invoiceNumberLabel(created);
    }
  }

  if (rowVersion && params.intent.metadata.minimaxPdfGenerated !== "true") {
    await runIssuedInvoiceAction({
      organisationId,
      issuedInvoiceId,
      rowVersion,
      actionName: invoiceAction(),
    });
  }

  const pdf = await getInvoicePdf({ organisationId, issuedInvoiceId });

  return {
    issuedInvoiceId,
    invoiceNumber,
    fiscalized: false,
    pdf,
  };
}
