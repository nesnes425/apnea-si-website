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
import { siteConfig, type CourseType } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const courseLabels: Record<CourseType, string> = {
  zacetni: "Začetni tečaj prostega potapljanja",
  nadaljevalni: "Nadaljevalni tečaj prostega potapljanja",
  master: "Master tečaj prostega potapljanja",
};

const courseShortLabels: Record<CourseType, string> = {
  zacetni: "Začetni",
  nadaljevalni: "Nadaljevalni",
  master: "Master",
};

function getAlumniListId(courseType: CourseType): number {
  const map: Record<CourseType, string> = {
    zacetni: "BREVO_LIST_ALUMNI_ZACETNI",
    nadaljevalni: "BREVO_LIST_ALUMNI_NADALJEVALNI",
    master: "BREVO_LIST_ALUMNI_MASTER",
  };
  const value = process.env[map[courseType]];
  if (!value) throw new Error(`Missing ${map[courseType]} env var`);
  const id = Number(value);
  if (!Number.isFinite(id)) throw new Error(`${map[courseType]} is not a number`);
  return id;
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

  const folderId = Number(process.env.BREVO_FOLDER_TECAJNIKI);
  if (!Number.isFinite(folderId)) {
    throw new Error("BREVO_FOLDER_TECAJNIKI is not a valid number");
  }

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

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");
  return { first, last };
}

async function handlePaymentIntentSucceeded(
  intent: Stripe.PaymentIntent
): Promise<void> {
  if (intent.metadata?.emailSent === "true") {
    console.log(`Skipping ${intent.id} — already processed`);
    return;
  }

  const m = intent.metadata ?? {};
  const courseType = m.courseType as CourseType | undefined;
  const courseInstanceId = m.courseInstanceId;
  const customerEmail = m.customerEmail;
  const customerName = m.customerName;
  const customerPhone = m.customerPhone;
  const courseStartDate = m.courseStartDate;
  const courseEndDate = m.courseEndDate;
  const courseLocation = m.courseLocation;

  const missing: string[] = [];
  if (!courseType) missing.push("courseType");
  if (!courseInstanceId) missing.push("courseInstanceId");
  if (!customerEmail) missing.push("customerEmail");
  if (!customerName) missing.push("customerName");
  if (!customerPhone) missing.push("customerPhone");
  if (!courseStartDate) missing.push("courseStartDate");
  if (!courseEndDate) missing.push("courseEndDate");
  if (!courseLocation) missing.push("courseLocation");
  if (missing.length > 0) {
    console.warn(`Skipping ${intent.id} — missing metadata fields: ${missing.join(", ")}`);
    return;
  }
  // Type-narrow after presence check.
  if (
    !courseType ||
    !courseInstanceId ||
    !customerEmail ||
    !customerName ||
    !customerPhone ||
    !courseStartDate ||
    !courseEndDate ||
    !courseLocation
  ) {
    return;
  }

  if (!(courseType in courseLabels)) {
    console.warn(`Skipping ${intent.id} — unknown courseType: ${courseType}`);
    return;
  }

  const dateRange = formatCourseDateRange(courseStartDate, courseEndDate);
  const courseName = courseLabels[courseType];
  const priceInEuros = (intent.amount ?? 0) / 100;
  const { first, last } = splitName(customerName);

  const slotListId = await findOrCreateSlotList({
    instanceId: courseInstanceId,
    courseType,
    startDateISO: courseStartDate,
    location: courseLocation,
  });
  const alumniListId = getAlumniListId(courseType);

  await upsertContact({
    email: customerEmail,
    firstName: first,
    lastName: last,
    phone: customerPhone,
    listIds: [slotListId, alumniListId],
  });

  const customerEmailContent = bookingConfirmationEmail({
    customerName,
    customerEmail,
    courseName,
    dateRange,
    location: courseLocation,
    priceInEuros,
    paymentIntentId: intent.id,
  });

  const samoEmailContent = samoNotificationEmail({
    customerName,
    customerEmail,
    customerPhone,
    courseName,
    dateRange,
    location: courseLocation,
    priceInEuros,
    paymentIntentId: intent.id,
  });

  await Promise.all([
    sendTransactionalEmail({
      to: { email: customerEmail, name: customerName },
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
      replyTo: { email: customerEmail, name: customerName },
    }),
  ]);

  await stripe.paymentIntents.update(intent.id, {
    metadata: { ...m, emailSent: "true" },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
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
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      default:
        // Ignore other events
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`Webhook handler error for ${event.id} (${event.type}): ${message}`);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
