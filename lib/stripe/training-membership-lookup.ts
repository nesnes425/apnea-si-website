import type Stripe from "stripe";
import { trainingStripe } from "./training-client";
import type { PaidTrainingMembership } from "@/lib/training/membership-check";

const MAX_PAGES = 3;

function isFullyRefunded(intent: Stripe.PaymentIntent) {
  const charge = intent.latest_charge;
  if (!charge || typeof charge === "string") return false;
  return charge.refunded || charge.amount_refunded >= charge.amount;
}

// Successful or still-processing, non-refunded training membership payments for this participant
// email since the season start. Stripe search is eventually consistent (usually
// under a minute), which covers the realistic "paid again a few minutes later" case.
export async function findPaidTrainingMemberships(
  email: string,
  sinceUnix: number
): Promise<PaidTrainingMembership[]> {
  const safeEmail = email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  // Stripe search cannot mix AND with OR, so the status is filtered below.
  const query = `metadata['customerEmail']:'${safeEmail}' AND created>=${sinceUnix}`;
  const memberships: PaidTrainingMembership[] = [];
  let page: string | undefined;

  for (let i = 0; i < MAX_PAGES; i += 1) {
    const result = await trainingStripe.paymentIntents.search({
      query,
      limit: 100,
      expand: ["data.latest_charge"],
      ...(page ? { page } : {}),
    });
    for (const intent of result.data) {
      if (intent.status !== "succeeded" && intent.status !== "processing") continue;
      if (intent.metadata.type !== "training_membership") continue;
      if (!intent.metadata.trainingGroupId || isFullyRefunded(intent)) continue;
      memberships.push({
        paymentIntentId: intent.id,
        groupId: intent.metadata.trainingGroupId,
        customerName: intent.metadata.customerName ?? "",
        created: intent.created,
        status: intent.status,
      });
    }
    if (!result.has_more || !result.next_page) break;
    page = result.next_page;
  }
  return memberships;
}
