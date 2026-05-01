"use server";

import { stripe } from "./client";
import { getCourseInstance } from "@/lib/sanity/queries";
import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { siteConfig } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";

export type CreateBookingResult =
  | { ok: true; clientSecret: string; paymentIntentId: string }
  | { ok: false; error: string };

export async function createBookingPaymentIntent(
  raw: BookingFormInput
): Promise<CreateBookingResult> {
  const parsed = bookingFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  }
  const data = parsed.data;

  const instance = await getCourseInstance(data.instanceId);
  if (!instance) {
    return { ok: false, error: "Termin ne obstaja. Izberite drug termin." };
  }
  if (instance.isFull) {
    return { ok: false, error: "Termin je razprodan. Izberite drug termin." };
  }

  const course = siteConfig.courses[instance.courseType];
  const dateRange = formatCourseDateRange(instance.startDate, instance.endDate);
  const description = `${course.fullName} — ${instance.location}, ${dateRange}`;

  const intent = await stripe.paymentIntents.create({
    amount: course.priceInCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    receipt_email: data.email,
    description,
    metadata: {
      courseInstanceId: instance._id,
      courseType: instance.courseType,
      courseStartDate: instance.startDate,
      courseEndDate: instance.endDate,
      courseLocation: instance.location,
      customerName: data.fullName,
      customerEmail: data.email,
      customerPhone: data.phone,
    },
  });

  if (!intent.client_secret) {
    return { ok: false, error: "Napaka pri ustvarjanju plačila. Poskusite znova." };
  }

  return {
    ok: true,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}
