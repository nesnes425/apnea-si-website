import type Stripe from "stripe";
import { splitName } from "@/lib/utils";
import { trainingConfirmationEmail } from "@/lib/brevo/emails/training-confirmation";
import {
  trainingCapacityConflictEmail,
  trainingNotificationEmail,
} from "@/lib/brevo/emails/training-notification";
import type { ConfirmTrainingHoldResult } from "@/lib/sanity/training-holds";
import type { MinimaxTrainingInvoiceResult } from "@/lib/minimax/training-invoice";

const weekdayLabels: Record<string, string> = {
  ponedeljek: "Ponedeljek",
  torek: "Torek",
  sreda: "Sreda",
  cetrtek: "Četrtek",
  petek: "Petek",
};

export type TrainingMetadata = {
  groupId: string;
  holdTokenHash: string;
  program: string;
  venue: string;
  city: string;
  weekday: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type TrainingPaymentEmail = {
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html: string;
  replyTo?: { email: string; name?: string };
  attachments?: { name: string; contentBase64: string }[];
};

export type TrainingPaymentProcessorDeps = {
  retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent>;
  updatePaymentIntent(id: string, metadata: Stripe.MetadataParam): Promise<void>;
  confirmTrainingHold(params: {
    groupId: string;
    tokenHash: string;
    paymentIntentId: string;
  }): Promise<ConfirmTrainingHoldResult>;
  getTrainingSettings(): Promise<{ membershipFee?: number } | null | undefined>;
  findOrCreateTrainingGroupList(groupId: string, name: string): Promise<number>;
  upsertContact(params: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    listIds: number[];
  }): Promise<void>;
  sendTransactionalEmail(params: TrainingPaymentEmail): Promise<void>;
  isMinimaxInvoicingEnabled(): boolean;
  createTrainingMinimaxInvoice(params: {
    intent: Stripe.PaymentIntent;
    membershipFee: number;
  }): Promise<MinimaxTrainingInvoiceResult>;
  notifyEmail: string;
  siteEmail: string;
  requireMinimaxPdf: boolean;
};

export function validateTrainingMetadata(metadata: Stripe.Metadata): TrainingMetadata | null {
  if (metadata.type !== "training_membership") return null;
  const required = [
    "trainingGroupId",
    "trainingHoldTokenHash",
    "trainingProgram",
    "trainingVenue",
    "trainingCity",
    "trainingWeekday",
    "trainingTime",
    "customerName",
    "customerEmail",
    "customerPhone",
  ] as const;
  if (required.some((key) => !metadata[key])) return null;
  return {
    groupId: metadata.trainingGroupId,
    holdTokenHash: metadata.trainingHoldTokenHash,
    program: metadata.trainingProgram,
    venue: metadata.trainingVenue,
    city: metadata.trainingCity,
    weekday: weekdayLabels[metadata.trainingWeekday] ?? metadata.trainingWeekday,
    time: metadata.trainingTime,
    customerName: metadata.customerName,
    customerEmail: metadata.customerEmail,
    customerPhone: metadata.customerPhone,
  };
}

function trimMetadataValue(value: string, maxLength = 450) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function completedMinimaxMetadata(
  metadata: Stripe.Metadata,
  invoice: MinimaxTrainingInvoiceResult
): Stripe.MetadataParam {
  return {
    ...metadata,
    minimaxInvoiceStatus: "completed",
    minimaxIssuedInvoiceId: String(invoice.issuedInvoiceId),
    minimaxInvoiceNumber: invoice.invoiceNumber ?? String(invoice.issuedInvoiceId),
    minimaxPdfGenerated: invoice.pdf ? "true" : "false",
    minimaxFailureAlertSent: "",
    minimaxLastError: "",
  };
}

async function sendMinimaxFailureAlert(params: {
  deps: TrainingPaymentProcessorDeps;
  intent: Stripe.PaymentIntent;
  data: TrainingMetadata;
  membershipFee: number;
  error: unknown;
}) {
  const message = errorMessage(params.error);
  const subject = `Minimax račun ni bil ustvarjen: ${params.data.customerName}`;
  const text = [
    "Stripe placilo je uspelo, Minimax racun pa ni bil ustvarjen.",
    "",
    `PaymentIntent: ${params.intent.id}`,
    `Znesek: ${params.membershipFee} EUR`,
    `Stranka: ${params.data.customerName}`,
    `Email: ${params.data.customerEmail}`,
    `Telefon: ${params.data.customerPhone}`,
    `Trening: ${params.data.program}, ${params.data.venue}, ${params.data.weekday} ${params.data.time}`,
    "",
    `Napaka: ${message}`,
    "",
    "Potrditveni email stranki ni bil poslan. Stripe webhook se bo ponovno poskusil izvesti.",
  ].join("\n");

  await params.deps.sendTransactionalEmail({
    to: { email: params.deps.notifyEmail },
    subject,
    text,
    html: text.replace(/\n/g, "<br />"),
    replyTo: { email: params.data.customerEmail, name: params.data.customerName },
  });
}

async function createMinimaxInvoiceForTraining(params: {
  deps: TrainingPaymentProcessorDeps;
  intent: Stripe.PaymentIntent;
  data: TrainingMetadata;
  membershipFee: number;
}): Promise<MinimaxTrainingInvoiceResult | undefined> {
  if (!params.deps.isMinimaxInvoicingEnabled()) return undefined;

  try {
    const invoice = await params.deps.createTrainingMinimaxInvoice({
      intent: params.intent,
      membershipFee: params.membershipFee,
    });
    await params.deps.updatePaymentIntent(
      params.intent.id,
      completedMinimaxMetadata(params.intent.metadata, invoice)
    );

    if (!invoice.pdf && params.deps.requireMinimaxPdf) {
      throw new Error(`Minimax invoice ${invoice.issuedInvoiceId} did not return a PDF attachment`);
    }

    return invoice;
  } catch (error) {
    if (params.intent.metadata.minimaxFailureAlertSent !== "true") {
      try {
        await sendMinimaxFailureAlert({ ...params, error });
      } catch (alertError) {
        console.error("Unable to send Minimax failure alert", alertError);
      }
    }

    await params.deps.updatePaymentIntent(params.intent.id, {
      ...params.intent.metadata,
      minimaxInvoiceStatus: "failed",
      minimaxFailureAlertSent: "true",
      minimaxLastError: trimMetadataValue(errorMessage(error)),
    });
    throw error;
  }
}

export async function processTrainingPaymentSucceeded(
  intent: Stripe.PaymentIntent,
  deps: TrainingPaymentProcessorDeps
) {
  const currentIntent = await deps.retrievePaymentIntent(intent.id);
  if (currentIntent.metadata.trainingProcessed === "true") return;
  const data = validateTrainingMetadata(currentIntent.metadata);
  if (!data) return;

  const confirmation = await deps.confirmTrainingHold({
    groupId: data.groupId,
    tokenHash: data.holdTokenHash,
    paymentIntentId: currentIntent.id,
  });
  const settings = await deps.getTrainingSettings();
  const membershipFee =
    (currentIntent.amount ?? Math.round((settings?.membershipFee ?? 35) * 100)) / 100;
  const emailData = { ...data, membershipFee, paymentIntentId: currentIntent.id };

  if (!confirmation.ok) {
    const alert = trainingCapacityConflictEmail(emailData);
    await Promise.all([
      deps.sendTransactionalEmail({
        to: { email: deps.notifyEmail },
        subject: alert.subject,
        text: alert.text,
        html: alert.html,
        replyTo: { email: data.customerEmail, name: data.customerName },
      }),
      deps.updatePaymentIntent(currentIntent.id, {
        ...currentIntent.metadata,
        trainingCapacityConflict: "true",
      }),
    ]);
    return;
  }

  const minimaxInvoice = await createMinimaxInvoiceForTraining({
    deps,
    intent: currentIntent,
    data,
    membershipFee,
  });
  const listName = `Trening · ${data.venue} · ${data.weekday} ${data.time} · ${data.program}`;
  const groupListId = await deps.findOrCreateTrainingGroupList(data.groupId, listName);
  const { first, last } = splitName(data.customerName);
  const customerContent = trainingConfirmationEmail(emailData);
  const notificationContent = trainingNotificationEmail(emailData);
  const invoiceAttachment = minimaxInvoice?.pdf
    ? [{ name: minimaxInvoice.pdf.fileName, contentBase64: minimaxInvoice.pdf.contentBase64 }]
    : undefined;

  await Promise.all([
    deps.upsertContact({
      email: data.customerEmail,
      firstName: first,
      lastName: last,
      phone: data.customerPhone,
      listIds: [groupListId],
    }),
    deps.sendTransactionalEmail({
      to: { email: data.customerEmail, name: data.customerName },
      subject: customerContent.subject,
      text: customerContent.text,
      html: customerContent.html,
      replyTo: { email: deps.siteEmail, name: "Apnea Slovenija" },
      attachments: invoiceAttachment,
    }),
    deps.sendTransactionalEmail({
      to: { email: deps.notifyEmail },
      subject: notificationContent.subject,
      text: notificationContent.text,
      html: notificationContent.html,
      replyTo: { email: data.customerEmail, name: data.customerName },
    }),
  ]);

  await deps.updatePaymentIntent(currentIntent.id, {
    ...currentIntent.metadata,
    ...(minimaxInvoice ? completedMinimaxMetadata(currentIntent.metadata, minimaxInvoice) : {}),
    trainingProcessed: "true",
  });
}
