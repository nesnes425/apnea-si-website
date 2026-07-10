import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { trainingStripe } from "@/lib/stripe/training-client";
import { confirmTrainingHold } from "@/lib/sanity/training-holds";
import { getTrainingGroup, getTrainingSettings } from "@/lib/sanity/queries";
import { sanityWriteClient } from "@/lib/sanity/client";
import { readEnv, readEnvNumber } from "@/lib/env";
import { createList, sendTransactionalEmail, upsertContact } from "@/lib/brevo/client";
import { siteConfig } from "@/lib/config";
import {
  createTrainingMinimaxInvoice,
  isTrainingMinimaxInvoicingEnabled,
} from "@/lib/minimax/training-invoice";
import { processTrainingPaymentSucceeded } from "@/lib/stripe/training-payment-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  await processTrainingPaymentSucceeded(intent, {
    retrievePaymentIntent: async (id) => trainingStripe.paymentIntents.retrieve(id),
    updatePaymentIntent: async (id, metadata) => {
      await trainingStripe.paymentIntents.update(id, { metadata });
    },
    confirmTrainingHold,
    getTrainingSettings,
    findOrCreateTrainingGroupList,
    upsertContact,
    sendTransactionalEmail,
    isMinimaxInvoicingEnabled: isTrainingMinimaxInvoicingEnabled,
    createTrainingMinimaxInvoice,
    notifyEmail: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email,
    siteEmail: siteConfig.email,
    requireMinimaxPdf: process.env.MINIMAX_TRAINING_REQUIRE_PDF !== "false",
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
