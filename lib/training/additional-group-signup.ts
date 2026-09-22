import { splitName } from "@/lib/utils";
import { trainingAdditionalGroupConfirmationEmail } from "@/lib/brevo/emails/training-confirmation";
import { trainingAdditionalGroupNotificationEmail } from "@/lib/brevo/emails/training-notification";
import type { ConfirmAdditionalSpotResult } from "@/lib/sanity/training-holds";
import type { TrainingGroup } from "@/lib/sanity/types";
import { weekdayLabels, type TrainingPaymentEmail } from "@/lib/stripe/training-payment-processor";
import { additionalGroupMarker } from "./membership-check";

export type AdditionalGroupSignupDeps = {
  getTrainingGroup(id: string): Promise<TrainingGroup | null>;
  confirmAdditionalTrainingSpot(params: {
    groupId: string;
    marker: string;
  }): Promise<ConfirmAdditionalSpotResult>;
  findOrCreateTrainingGroupList(groupId: string, name: string): Promise<number>;
  upsertContact(params: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    listIds: number[];
  }): Promise<void>;
  sendTransactionalEmail(params: TrainingPaymentEmail): Promise<void>;
  notifyEmail: string;
  siteEmail: string;
};

export async function processAdditionalGroupSignup(
  input: {
    groupId: string;
    fullName: string;
    email: string;
    phone: string;
    membershipPaymentIntentId: string;
  },
  deps: AdditionalGroupSignupDeps
): Promise<{ ok: true } | { ok: false; error: string }> {
  const group = await deps.getTrainingGroup(input.groupId);
  if (!group?.active) return { ok: false, error: "Izbrana skupina ni več na voljo." };

  const confirmation = await deps.confirmAdditionalTrainingSpot({
    groupId: group._id,
    marker: additionalGroupMarker(input.membershipPaymentIntentId),
  });
  if (!confirmation.ok) {
    if (confirmation.reason === "full") return { ok: false, error: "Izbrana skupina je polna." };
    if (confirmation.reason === "group_missing") {
      return { ok: false, error: "Izbrana skupina ni več na voljo." };
    }
    return { ok: false, error: "Mesta trenutno ni mogoče rezervirati. Poskusite znova." };
  }
  // A concurrent submit already completed this signup and sent the emails.
  if (confirmation.alreadyConfirmed) return { ok: true };

  const weekday = weekdayLabels[group.weekday] ?? group.weekday;
  const time = `${group.startTime}–${group.endTime}`;
  const emailData = {
    customerName: input.fullName,
    program: group.program.name,
    venue: group.venue.name,
    city: group.venue.city,
    weekday,
    time,
  };
  const customerContent = trainingAdditionalGroupConfirmationEmail(emailData);
  const notificationContent = trainingAdditionalGroupNotificationEmail({
    ...emailData,
    customerEmail: input.email,
    customerPhone: input.phone,
    membershipPaymentIntentId: input.membershipPaymentIntentId,
  });
  const { first, last } = splitName(input.fullName);

  // The spot is reserved; follow-up failures are logged and do not undo it.
  const results = await Promise.allSettled([
    deps
      .findOrCreateTrainingGroupList(
        group._id,
        `Trening · ${group.venue.name} · ${weekday} ${time} · ${group.program.name}`
      )
      .then((listId) =>
        deps.upsertContact({
          email: input.email,
          firstName: first,
          lastName: last,
          phone: input.phone,
          listIds: [listId],
        })
      ),
    deps.sendTransactionalEmail({
      to: { email: input.email, name: input.fullName },
      subject: customerContent.subject,
      text: customerContent.text,
      html: customerContent.html,
      replyTo: { email: deps.siteEmail, name: "Apnea Slovenija" },
    }),
    deps.sendTransactionalEmail({
      to: { email: deps.notifyEmail },
      subject: notificationContent.subject,
      text: notificationContent.text,
      html: notificationContent.html,
      replyTo: { email: input.email, name: input.fullName },
    }),
  ]);
  const labels = ["Brevo contact", "customer email", "admin notification"];
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`Additional training signup: unable to complete ${labels[index]}`, result.reason);
    }
  });

  return { ok: true };
}
