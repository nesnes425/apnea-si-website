import { NextResponse } from "next/server";
import { sanityWriteClient } from "@/lib/sanity/client";
import type { TrainingHold } from "@/lib/sanity/types";
import { trainingStripe } from "@/lib/stripe/training-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GroupWithHolds = {
  _id: string;
  holds?: TrainingHold[];
};

export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await sanityWriteClient.fetch<GroupWithHolds[]>(
    `*[_type == "trainingGroup" && count(coalesce(holds, [])) > 0] { _id, holds }`
  );
  const now = Date.now();
  let updated = 0;

  for (const group of groups) {
    const expiredHolds = (group.holds ?? []).filter(
      (hold) => new Date(hold.expiresAt).getTime() <= now
    );
    const activeHolds = (group.holds ?? []).filter(
      (hold) => new Date(hold.expiresAt).getTime() > now
    );
    if (activeHolds.length !== (group.holds ?? []).length) {
      if (process.env.TRAINING_STRIPE_SECRET_KEY) {
        await Promise.all(
          expiredHolds
            .filter((hold) => hold.paymentIntentId)
            .map(async (hold) => {
              try {
                await trainingStripe.paymentIntents.cancel(hold.paymentIntentId!, {
                  cancellation_reason: "abandoned",
                });
              } catch (error) {
                console.warn(
                  `Could not cancel expired training PaymentIntent ${hold.paymentIntentId}`,
                  error
                );
              }
            })
        );
      }
      await sanityWriteClient.patch(group._id).set({ holds: activeHolds }).commit();
      updated += 1;
    }
  }

  return NextResponse.json({ checked: groups.length, updated });
}
