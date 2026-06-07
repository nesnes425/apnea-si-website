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

async function handleTrainingSucceeded(intent: Stripe.PaymentIntent) {
  if (intent.metadata.trainingProcessed === "true") return;
  const data = validateTrainingMetadata(intent.metadata);
  if (!data) return;

  const confirmation = await confirmTrainingHold({
    groupId: data.groupId,
    tokenHash: data.holdTokenHash,
    paymentIntentId: intent.id,
  });
  const settings = await getTrainingSettings();
  const membershipFee = (intent.amount ?? Math.round((settings?.membershipFee ?? 35) * 100)) / 100;
  const emailData = { ...data, membershipFee, paymentIntentId: intent.id };

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
      trainingStripe.paymentIntents.update(intent.id, {
        metadata: { ...intent.metadata, trainingCapacityConflict: "true" },
      }),
    ]);
    return;
  }

  const listName = `Trening · ${data.venue} · ${data.weekday} ${data.time} · ${data.program}`;
  const groupListId = await findOrCreateTrainingGroupList(data.groupId, listName);
  const { first, last } = splitName(data.customerName);
  const customerContent = trainingConfirmationEmail(emailData);
  const notificationContent = trainingNotificationEmail(emailData);

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
    }),
    sendTransactionalEmail({
      to: { email: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email },
      subject: notificationContent.subject,
      text: notificationContent.text,
      html: notificationContent.html,
      replyTo: { email: data.customerEmail, name: data.customerName },
    }),
  ]);

  await trainingStripe.paymentIntents.update(intent.id, {
    metadata: { ...intent.metadata, trainingProcessed: "true" },
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
