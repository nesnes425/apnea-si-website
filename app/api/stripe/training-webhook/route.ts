import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import { confirmTrainingHold } from "@/lib/sanity/training-holds";
import { getTrainingGroup, getTrainingSettings } from "@/lib/sanity/queries";
import { sanityWriteClient } from "@/lib/sanity/client";
import { readEnv, readEnvNumber } from "@/lib/env";
import { splitName } from "@/lib/utils";
import { createList, sendTransactionalEmail, upsertContact } from "@/lib/brevo/client";
import { trainingConfirmationEmail } from "@/lib/brevo/emails/training-confirmation";
import {
  trainingCapacityConflictEmail,
  trainingNotificationEmail,
} from "@/lib/brevo/emails/training-notification";
import { siteConfig } from "@/lib/config";
import {
  createTrainingMinimaxInvoice,
  isTrainingMinimaxInvoicingEnabled,
  type MinimaxTrainingInvoiceResult,
} from "@/lib/minimax/training-invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const weekdayLabels: Record<string, string> = {
  ponedeljek: "Ponedeljek",
  torek: "Torek",
  sreda: "Sreda",
  cetrtek: "Četrtek",
  petek: "Petek",
};

type TrainingMetadata = {
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

function validateTrainingMetadata(metadata: Stripe.Metadata): TrainingMetadata | null {
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

async function findOrCreateTrainingGroupList(groupId: string, name: string): Promise<number> {
  const group = await getTrainingGroup(groupId);
  if (group?.brevoListId) return group.brevoListId;
  const listId = await createList({
    name,
    folderId: readEnvNumber("BREVO_FOLDER_TRAININGS"),
  });
  await sanityWriteClient.patch(groupId).set({ brevoListId: listId }).commit();
  return listId;
}

function trimMetadataValue(value: string, maxLength = 450) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function sendMinimaxFailureAlert(params: {
  intent: Stripe.PaymentIntent;
  data: TrainingMetadata;
  membershipFee: number;
  error: unknown;
}) {
  const message = errorMessage(params.error);
  const subject = `Minimax račun ni bil ustvarjen: ${params.data.customerName}`;
  const text = [
    "Stripe testno placilo je uspelo, Minimax racun pa ni bil ustvarjen.",
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
    "Customer email ni bil poslan. Stripe webhook se bo ponovno poskusil izvesti.",
  ].join("\n");

  await sendTransactionalEmail({
    to: { email: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email },
    subject,
    text,
    html: text.replace(/\n/g, "<br />"),
    replyTo: { email: params.data.customerEmail, name: params.data.customerName },
  });
}

async function createMinimaxInvoiceForTraining(params: {
  intent: Stripe.PaymentIntent;
  data: TrainingMetadata;
  membershipFee: number;
}): Promise<MinimaxTrainingInvoiceResult | undefined> {
  if (!isTrainingMinimaxInvoicingEnabled()) return undefined;

  try {
    const invoice = await createTrainingMinimaxInvoice({
      intent: params.intent,
      membershipFee: params.membershipFee,
    });
    const metadata = {
      ...params.intent.metadata,
      minimaxInvoiceStatus: "completed",
      minimaxInvoiceMode: "test_non_fiscal",
      minimaxFiscalized: "false",
      minimaxIssuedInvoiceId: String(invoice.issuedInvoiceId),
      minimaxInvoiceNumber: invoice.invoiceNumber ?? String(invoice.issuedInvoiceId),
      minimaxPdfGenerated: invoice.pdf ? "true" : "false",
    };

    await trainingStripe.paymentIntents.update(params.intent.id, { metadata });

    if (!invoice.pdf && process.env.MINIMAX_TRAINING_REQUIRE_PDF !== "false") {
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

    await trainingStripe.paymentIntents.update(params.intent.id, {
      metadata: {
        ...params.intent.metadata,
        minimaxInvoiceStatus: "failed",
        minimaxInvoiceMode: "test_non_fiscal",
        minimaxFiscalized: "false",
        minimaxFailureAlertSent: "true",
        minimaxLastError: trimMetadataValue(errorMessage(error)),
      },
    });
    throw error;
  }
}

async function handleTrainingSucceeded(intent: Stripe.PaymentIntent) {
  const currentIntent = await trainingStripe.paymentIntents.retrieve(intent.id);
  if (currentIntent.metadata.trainingProcessed === "true") return;
  const data = validateTrainingMetadata(currentIntent.metadata);
  if (!data) return;

  const confirmation = await confirmTrainingHold({
    groupId: data.groupId,
    tokenHash: data.holdTokenHash,
    paymentIntentId: currentIntent.id,
  });
  const settings = await getTrainingSettings();
  const membershipFee =
    (currentIntent.amount ?? Math.round((settings?.membershipFee ?? 35) * 100)) / 100;
  const emailData = { ...data, membershipFee, paymentIntentId: currentIntent.id };

  if (!confirmation.ok) {
    const alert = trainingCapacityConflictEmail(emailData);
    await Promise.all([
      sendTransactionalEmail({
        to: { email: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email },
        subject: alert.subject,
        text: alert.text,
        html: alert.html,
        replyTo: { email: data.customerEmail, name: data.customerName },
      }),
      trainingStripe.paymentIntents.update(currentIntent.id, {
        metadata: { ...currentIntent.metadata, trainingCapacityConflict: "true" },
      }),
    ]);
    return;
  }

  const minimaxInvoice = await createMinimaxInvoiceForTraining({
    intent: currentIntent,
    data,
    membershipFee,
  });
  const listName = `Trening · ${data.venue} · ${data.weekday} ${data.time} · ${data.program}`;
  const groupListId = await findOrCreateTrainingGroupList(data.groupId, listName);
  const { first, last } = splitName(data.customerName);
  const customerContent = trainingConfirmationEmail(emailData);
  const notificationContent = trainingNotificationEmail(emailData);
  const invoiceAttachment = minimaxInvoice?.pdf
    ? [{ name: minimaxInvoice.pdf.fileName, contentBase64: minimaxInvoice.pdf.contentBase64 }]
    : undefined;

  await Promise.all([
    upsertContact({
      email: data.customerEmail,
      firstName: first,
      lastName: last,
      phone: data.customerPhone,
      listIds: [groupListId],
    }),
    sendTransactionalEmail({
      to: { email: data.customerEmail, name: data.customerName },
      subject: customerContent.subject,
      text: customerContent.text,
      html: customerContent.html,
      replyTo: { email: siteConfig.email, name: "Apnea Slovenija" },
      attachments: invoiceAttachment,
    }),
    sendTransactionalEmail({
      to: { email: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email },
      subject: notificationContent.subject,
      text: notificationContent.text,
      html: notificationContent.html,
      replyTo: { email: data.customerEmail, name: data.customerName },
    }),
  ]);

  await trainingStripe.paymentIntents.update(currentIntent.id, {
    metadata: {
      ...currentIntent.metadata,
      ...(minimaxInvoice
        ? {
            minimaxInvoiceStatus: "completed",
            minimaxInvoiceMode: "test_non_fiscal",
            minimaxFiscalized: "false",
            minimaxIssuedInvoiceId: String(minimaxInvoice.issuedInvoiceId),
            minimaxInvoiceNumber:
              minimaxInvoice.invoiceNumber ?? String(minimaxInvoice.issuedInvoiceId),
            minimaxPdfGenerated: minimaxInvoice.pdf ? "true" : "false",
          }
        : {}),
      trainingProcessed: "true",
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = trainingStripe.webhooks.constructEvent(
      rawBody,
      signature,
      readEnv("TRAINING_STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    console.error("Training webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await handleTrainingSucceeded(event.data.object);
    }
  } catch (error) {
    console.error(`Training webhook failed for ${event.id}`, error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
