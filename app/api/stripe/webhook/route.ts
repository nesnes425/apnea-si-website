import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { sanityWriteClient } from "@/lib/sanity/client";
import { getCourseInstance } from "@/lib/sanity/queries";
import {
  createList,
  upsertContact,
  sendTransactionalEmail,
} from "@/lib/brevo/client";
import { bookingConfirmationEmail } from "@/lib/brevo/emails/booking-confirmation";
import { samoNotificationEmail } from "@/lib/brevo/emails/samo-notification";
import { voucherBuyerEmail } from "@/lib/brevo/emails/voucher-buyer";
import { voucherRecipientEmail } from "@/lib/brevo/emails/voucher-recipient";
import { siteConfig, type CourseType } from "@/lib/config";
import { readEnv, readEnvNumber } from "@/lib/env";
import { formatCourseDateRange, splitName } from "@/lib/utils";
import { voucherCodeFromPaymentIntentId, voucherValidUntil } from "@/lib/voucher-code";
import { renderVoucherPdfBase64 } from "@/lib/voucher-pdf/Voucher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const courseShortLabels: Record<CourseType, string> = {
  zacetni: "Začetni",
  nadaljevalni: "Nadaljevalni",
  master: "Master",
};

const courseTypeToAlumniListEnv: Record<CourseType, string> = {
  zacetni: "BREVO_LIST_ALUMNI_ZACETNI",
  nadaljevalni: "BREVO_LIST_ALUMNI_NADALJEVALNI",
  master: "BREVO_LIST_ALUMNI_MASTER",
};

function isCourseType(value: string | undefined): value is CourseType {
  return value !== undefined && value in siteConfig.courses;
}

type RequiredMetadata = {
  courseType: CourseType;
  courseInstanceId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  courseStartDate: string;
  courseEndDate: string;
  courseLocation: string;
};

function validateMetadata(
  m: Stripe.Metadata,
  intentId: string
): RequiredMetadata | null {
  const required = [
    "courseInstanceId",
    "customerEmail",
    "customerName",
    "customerPhone",
    "courseStartDate",
    "courseEndDate",
    "courseLocation",
  ] as const;
  const missing = required.filter((k) => !m[k]);
  if (missing.length > 0) {
    console.warn(`Skipping ${intentId} — missing metadata fields: ${missing.join(", ")}`);
    return null;
  }
  if (!isCourseType(m.courseType)) {
    console.warn(`Skipping ${intentId} — unknown courseType: ${m.courseType}`);
    return null;
  }
  return {
    courseType: m.courseType,
    courseInstanceId: m.courseInstanceId,
    customerEmail: m.customerEmail,
    customerName: m.customerName,
    customerPhone: m.customerPhone,
    courseStartDate: m.courseStartDate,
    courseEndDate: m.courseEndDate,
    courseLocation: m.courseLocation,
  };
}

function buildSlotListName(
  courseType: CourseType,
  startDateISO: string,
  location: string
): string {
  const d = new Date(startDateISO);
  const short = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  return `${courseShortLabels[courseType]} · ${location} · ${short}`;
}

async function findOrCreateSlotList(params: {
  instanceId: string;
  courseType: CourseType;
  startDateISO: string;
  location: string;
}): Promise<number> {
  const instance = await getCourseInstance(params.instanceId);
  if (instance?.brevoListId) {
    return instance.brevoListId;
  }

  const folderId = readEnvNumber("BREVO_FOLDER_TECAJNIKI");
  const name = buildSlotListName(
    params.courseType,
    params.startDateISO,
    params.location
  );

  const listId = await createList({ name, folderId });

  await sanityWriteClient
    .patch(params.instanceId)
    .set({ brevoListId: listId })
    .commit();

  return listId;
}

async function handlePaymentIntentSucceeded(
  intent: Stripe.PaymentIntent
): Promise<void> {
  if (intent.metadata?.emailSent === "true") {
    console.log(`Skipping ${intent.id} — already processed`);
    return;
  }

  const m = intent.metadata ?? {};
  const data = validateMetadata(m, intent.id);
  if (!data) return;

  const dateRange = formatCourseDateRange(data.courseStartDate, data.courseEndDate);
  const courseName = siteConfig.courses[data.courseType].fullName;
  const priceInEuros = (intent.amount ?? 0) / 100;
  const { first, last } = splitName(data.customerName);

  const slotListId = await findOrCreateSlotList({
    instanceId: data.courseInstanceId,
    courseType: data.courseType,
    startDateISO: data.courseStartDate,
    location: data.courseLocation,
  });
  const alumniListId = readEnvNumber(courseTypeToAlumniListEnv[data.courseType]);

  const customerEmailContent = bookingConfirmationEmail({
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    courseName,
    dateRange,
    location: data.courseLocation,
    priceInEuros,
    paymentIntentId: intent.id,
  });

  const samoEmailContent = samoNotificationEmail({
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    courseName,
    dateRange,
    location: data.courseLocation,
    priceInEuros,
    paymentIntentId: intent.id,
  });

  // Contact upsert and emails are independent; run in parallel to stay under
  // Stripe's 5s retry budget. PI metadata update is sequential after — only
  // mark as processed once everything above succeeded.
  await Promise.all([
    upsertContact({
      email: data.customerEmail,
      firstName: first,
      lastName: last,
      phone: data.customerPhone,
      listIds: [slotListId, alumniListId],
    }),
    sendTransactionalEmail({
      to: { email: data.customerEmail, name: data.customerName },
      subject: customerEmailContent.subject,
      text: customerEmailContent.text,
      html: customerEmailContent.html,
      replyTo: { email: siteConfig.email, name: "Apnea Slovenija" },
    }),
    sendTransactionalEmail({
      to: { email: process.env.BREVO_NOTIFY_EMAIL ?? siteConfig.email },
      subject: samoEmailContent.subject,
      text: samoEmailContent.text,
      html: samoEmailContent.html,
      replyTo: { email: data.customerEmail, name: data.customerName },
    }),
  ]);

  await stripe.paymentIntents.update(intent.id, {
    metadata: { ...m, emailSent: "true" },
  });
}

// === Gift voucher branch ===

const slMonths = [
  "januar", "februar", "marec", "april", "maj", "junij",
  "julij", "avgust", "september", "oktober", "november", "december",
];

function formatSlDate(d: Date): string {
  return `${d.getDate()}. ${slMonths[d.getMonth()]} ${d.getFullYear()}`;
}

type GiftVoucherMetadata = {
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
};

function validateGiftVoucherMetadata(
  m: Stripe.Metadata,
  intentId: string
): GiftVoucherMetadata | null {
  const required = ["buyerName", "buyerEmail", "recipientName", "recipientEmail"] as const;
  const missing = required.filter((k) => !m[k]);
  if (missing.length > 0) {
    console.warn(`Skipping gift voucher ${intentId} — missing metadata: ${missing.join(", ")}`);
    return null;
  }
  return {
    buyerName: m.buyerName,
    buyerEmail: m.buyerEmail,
    recipientName: m.recipientName,
    recipientEmail: m.recipientEmail,
    message: m.message ?? "",
  };
}

async function handleGiftVoucherSucceeded(intent: Stripe.PaymentIntent): Promise<void> {
  if (intent.metadata?.emailSent === "true") {
    console.log(`Skipping voucher ${intent.id} — already processed`);
    return;
  }

  const data = validateGiftVoucherMetadata(intent.metadata ?? {}, intent.id);
  if (!data) return;

  const courseName = siteConfig.giftVoucher.fullName;
  const priceInEuros = (intent.amount ?? 0) / 100;
  const voucherCode = voucherCodeFromPaymentIntentId(intent.id);
  const purchaseDate = new Date((intent.created ?? Math.floor(Date.now() / 1000)) * 1000);
  const validUntil = voucherValidUntil(purchaseDate);
  const validUntilLabel = formatSlDate(validUntil);

  const pdfBase64 = await renderVoucherPdfBase64({
    voucherCode,
    recipientName: data.recipientName,
    buyerName: data.buyerName,
    message: data.message || undefined,
    courseName,
    validUntil,
    purchaseDate,
  });

  const buyerContent = voucherBuyerEmail({
    buyerName: data.buyerName,
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    courseName,
    voucherCode,
    priceInEuros,
    paymentIntentId: intent.id,
    validUntilLabel,
  });

  const recipientContent = voucherRecipientEmail({
    buyerName: data.buyerName,
    recipientName: data.recipientName,
    message: data.message || undefined,
    courseName,
    voucherCode,
    validUntilLabel,
  });

  const attachment = [
    { name: `darilni-bon-${voucherCode}.pdf`, contentBase64: pdfBase64 },
  ];

  await Promise.all([
    sendTransactionalEmail({
      to: { email: data.buyerEmail, name: data.buyerName },
      subject: buyerContent.subject,
      text: buyerContent.text,
      html: buyerContent.html,
      replyTo: { email: siteConfig.email, name: "Apnea Slovenija" },
      attachments: attachment,
    }),
    sendTransactionalEmail({
      to: { email: data.recipientEmail, name: data.recipientName },
      subject: recipientContent.subject,
      text: recipientContent.text,
      html: recipientContent.html,
      replyTo: { email: data.buyerEmail, name: data.buyerName },
      attachments: attachment,
    }),
  ]);

  await stripe.paymentIntents.update(intent.id, {
    metadata: { ...intent.metadata, emailSent: "true" },
  });
}

async function handlePaymentIntentSucceededDispatch(intent: Stripe.PaymentIntent): Promise<void> {
  if (intent.metadata?.type === "gift_voucher") {
    await handleGiftVoucherSucceeded(intent);
  } else {
    await handlePaymentIntentSucceeded(intent);
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let webhookSecret: string;
  try {
    webhookSecret = readEnv("STRIPE_WEBHOOK_SECRET");
  } catch {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceededDispatch(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`Webhook handler error for ${event.id} (${event.type}): ${message}`);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
