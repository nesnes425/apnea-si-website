"use server";

import { createHash, randomUUID } from "node:crypto";
import { sanityWriteClient } from "./client";
import { getTrainingGroup, getTrainingSettings } from "./queries";
import {
  trainingReservationSchema,
  type TrainingReservationInput,
} from "@/lib/training-reservation-schema";
import type { TrainingHold } from "./types";

type HoldResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string };

export type ConfirmTrainingHoldResult =
  | { ok: true; alreadyConfirmed: boolean }
  | { ok: false; reason: "capacity_conflict" | "group_missing" };

const MAX_MUTATION_ATTEMPTS = 4;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTrainingHold(
  raw: TrainingReservationInput
): Promise<HoldResult> {
  const parsed = trainingReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };
  }

  const settings = await getTrainingSettings();
  if (!settings?.applicationsOpen) {
    return {
      ok: false,
      error: "Spletne prijave so trenutno zaprte. Pišite nam na info@apnea.si.",
    };
  }

  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const group = await getTrainingGroup(parsed.data.groupId);
    if (!group?.active) {
      return { ok: false, error: "Izbrana skupina ni več na voljo." };
    }

    const now = Date.now();
    const activeHolds = (group.holds ?? []).filter(
      (hold) => new Date(hold.expiresAt).getTime() > now
    );
    if (group.confirmedSpots + activeHolds.length >= group.capacity) {
      return { ok: false, error: "Izbrana skupina je polna." };
    }

    const token = randomUUID();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(now + settings.holdMinutes * 60_000).toISOString();
    const hold: TrainingHold = { _key: tokenHash, tokenHash, expiresAt };

    try {
      await sanityWriteClient
        .patch(group._id)
        .ifRevisionId(group._rev)
        .set({ holds: [...activeHolds, hold] })
        .commit();
      return { ok: true, token, expiresAt };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isConflict =
        message.includes("revision") ||
        message.includes("conflict") ||
        message.includes("precondition");
      if (!isConflict || attempt === MAX_MUTATION_ATTEMPTS - 1) {
        console.error("Unable to create training hold", error);
        return {
          ok: false,
          error: "Mesta trenutno ni mogoče rezervirati. Poskusite znova.",
        };
      }
    }
  }

  return { ok: false, error: "Mesta trenutno ni mogoče rezervirati." };
}

export async function validateTrainingHold(params: {
  groupId: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const group = await getTrainingGroup(params.groupId);
  if (!group?.active) {
    return { ok: false, error: "Izbrana skupina ni več na voljo." };
  }

  const tokenHash = hashToken(params.token);
  const hold = (group.holds ?? []).find((candidate) => candidate.tokenHash === tokenHash);
  if (!hold || new Date(hold.expiresAt).getTime() <= Date.now()) {
    return {
      ok: false,
      error: "Rezervacija mesta je potekla. Vrnite se na urnik in ponovno izberite skupino.",
    };
  }
  return { ok: true };
}

export async function attachPaymentIntentToTrainingHold(params: {
  groupId: string;
  token: string;
  paymentIntentId: string;
}): Promise<void> {
  const tokenHash = hashToken(params.token);
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const group = await getTrainingGroup(params.groupId);
    if (!group) return;
    const holds = (group.holds ?? []).map((hold) =>
      hold.tokenHash === tokenHash
        ? { ...hold, paymentIntentId: params.paymentIntentId }
        : hold
    );
    try {
      await sanityWriteClient
        .patch(group._id)
        .ifRevisionId(group._rev)
        .set({ holds })
        .commit();
      return;
    } catch (error) {
      if (attempt === MAX_MUTATION_ATTEMPTS - 1) {
        console.error("Unable to attach PaymentIntent to training hold", error);
      }
    }
  }
}

export async function releaseTrainingHold(params: {
  groupId: string;
  token: string;
}): Promise<void> {
  const tokenHash = hashToken(params.token);
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const group = await getTrainingGroup(params.groupId);
    if (!group) return;
    const remaining = (group.holds ?? []).filter((hold) => hold.tokenHash !== tokenHash);
    if (remaining.length === (group.holds ?? []).length) return;
    try {
      await sanityWriteClient
        .patch(group._id)
        .ifRevisionId(group._rev)
        .set({ holds: remaining })
        .commit();
      return;
    } catch (error) {
      if (attempt === MAX_MUTATION_ATTEMPTS - 1) {
        console.error("Unable to release training hold", error);
      }
    }
  }
}

export async function confirmTrainingHold(params: {
  groupId: string;
  tokenHash: string;
  paymentIntentId: string;
}): Promise<ConfirmTrainingHoldResult> {
  for (let attempt = 0; attempt < MAX_MUTATION_ATTEMPTS; attempt += 1) {
    const group = await getTrainingGroup(params.groupId);
    if (!group) return { ok: false, reason: "group_missing" };

    const confirmedIds = group.confirmedPaymentIntentIds ?? [];
    if (confirmedIds.includes(params.paymentIntentId)) {
      return { ok: true, alreadyConfirmed: true };
    }
    if (group.confirmedSpots >= group.capacity) {
      return { ok: false, reason: "capacity_conflict" };
    }

    const now = Date.now();
    const remainingHolds = (group.holds ?? []).filter(
      (hold) =>
        hold.tokenHash !== params.tokenHash &&
        new Date(hold.expiresAt).getTime() > now
    );

    try {
      await sanityWriteClient
        .patch(group._id)
        .ifRevisionId(group._rev)
        .set({
          holds: remainingHolds,
          confirmedSpots: group.confirmedSpots + 1,
          confirmedPaymentIntentIds: [...confirmedIds, params.paymentIntentId],
        })
        .commit();
      return { ok: true, alreadyConfirmed: false };
    } catch (error) {
      if (attempt === MAX_MUTATION_ATTEMPTS - 1) {
        console.error("Unable to confirm training hold", error);
      }
    }
  }
  return { ok: false, reason: "capacity_conflict" };
}
