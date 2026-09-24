"use server";

import { sendTransactionalEmail } from "@/lib/brevo/client";
import {
  courseApplicationConfirmationEmail,
  courseApplicationNotificationEmail,
} from "@/lib/brevo/emails/course-application";
import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { siteConfig } from "@/lib/config";
import { toCourseDepthOptions } from "@/lib/course-depth-options";
import { readEnv } from "@/lib/env";
import { sanityWriteClient } from "@/lib/sanity/client";
import {
  getActiveCourseApplicationCount,
  getCourseInstance,
  getOpenCourseDepthSessions,
} from "@/lib/sanity/queries";
import { formatCourseDateRange, formatCourseLocation } from "@/lib/utils";

export type CourseApplicationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitCourseApplication(
  raw: BookingFormInput
): Promise<CourseApplicationResult> {
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
  const applicationCount = await getActiveCourseApplicationCount(instance._id);
  if (applicationCount >= instance.maxSpots) {
    return { ok: false, error: "Termin je zapolnjen. Izberite drug termin." };
  }

  const course = siteConfig.courses[instance.courseType];
  const depthOptions = toCourseDepthOptions(await getOpenCourseDepthSessions());
  const depthOption = depthOptions.find((option) => option.value === data.depthOptionId);
  if (depthOptions.length > 0 && !depthOption) {
    return { ok: false, error: "Izberite termin globinskega dela." };
  }
  const dateRange = formatCourseDateRange(instance.startDate, instance.endDate);
  const emailData = {
    customerName: data.fullName,
    customerEmail: data.email,
    customerPhone: data.phone,
    note: data.note,
    courseName: course.fullName,
    dateRange,
    location: formatCourseLocation(instance.location),
    depthDateRange: depthOption?.dateRange,
    depthLocation: depthOption?.location,
    priceInEuros: course.price,
  };

  try {
    const notify = readEnv("BREVO_NOTIFY_EMAIL");
    const notification = courseApplicationNotificationEmail(emailData);
    const confirmation = courseApplicationConfirmationEmail(emailData);

    await Promise.all([
      sanityWriteClient.create({
        _type: "courseApplication",
        submittedAt: new Date().toISOString(),
        courseInstance: { _type: "reference", _ref: instance._id },
        ...(depthOption
          ? { depthSession: { _type: "reference", _ref: depthOption.value } }
          : {}),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        note: data.note,
        depositStatus: "pending",
        fullPaymentStatus: "pending",
      }),
      sendTransactionalEmail({
        to: { email: notify },
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        replyTo: { email: data.email, name: data.fullName },
      }),
      sendTransactionalEmail({
        to: { email: data.email, name: data.fullName },
        subject: confirmation.subject,
        text: confirmation.text,
        html: confirmation.html,
        replyTo: { email: notify, name: "Apnea Slovenija" },
      }),
    ]);

    return { ok: true };
  } catch (error) {
    console.error("Course application failed:", error);
    return {
      ok: false,
      error: "Prijave ni bilo mogoče poslati. Poskusite znova ali nam pišite na info@apnea.si.",
    };
  }
}
