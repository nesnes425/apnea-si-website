"use server";

import { headers } from "next/headers";
import { siteConfig } from "@/lib/config";
import type { TrainingGroup } from "@/lib/sanity/types";
import { splitName } from "@/lib/utils";
import { isStatikaEmailReplay, processStatikaSignup, statikaPreviewAllowed, type StatikaSignupDeps, type StatikaSignupResult } from "./statika-signup";
import { statikaSignupSchema, type StatikaSignupInput } from "./statika-signup-schema";

const previewMarkers = new Set<string>();

function previewDependencies(email: string, fullName: string): StatikaSignupDeps {
  const group = {
    _id: siteConfig.trainings.statikaGroupId,
    _rev: "local-preview", _type: "trainingGroup", active: true,
    weekday: "sreda", startTime: "20:45", endTime: "21:45", capacity: 12,
    confirmedSpots: previewMarkers.size, confirmedPaymentIntentIds: [...previewMarkers], holds: [],
    venue: { _id: "preview-tivoli", name: "Tivoli", city: "Ljubljana", active: true },
    program: { _id: "preview-statika", name: "Statika", active: true },
  } as unknown as TrainingGroup;
  return {
    statikaGroupId: siteConfig.trainings.statikaGroupId,
    notifyEmail: "preview-admin@example.com", siteEmail: "preview-reply@example.com",
    getSettings: async () => ({ applicationsOpen: true, seasonLabel: "2026/27" }),
    getGroup: async () => group,
    findMemberships: async () => ["confirmed@example.com", "confirmed@example.invalid"].includes(email)
      ? [{ paymentIntentId: "pi_local_statika_preview", groupId: "preview-other-group", customerName: fullName, created: 1_790_000_000, status: "succeeded" }]
      : [],
    confirmSpot: async ({ marker }) => {
      const alreadyConfirmed = previewMarkers.has(marker);
      previewMarkers.add(marker);
      return { ok: true, alreadyConfirmed };
    },
    addContact: async () => {},
    sendEmail: async () => {},
  };
}

export async function submitStatikaSignup(raw: StatikaSignupInput): Promise<StatikaSignupResult> {
  const parsed = statikaSignupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Podatki niso popolni. Preverite obrazec." };

  if (process.env.TRAINING_SIGNUP_PREVIEW === "true") {
    const host = (await headers()).get("host") ?? "";
    if (!statikaPreviewAllowed({ enabled: process.env.TRAINING_SIGNUP_PREVIEW, nodeEnv: process.env.NODE_ENV, vercel: process.env.VERCEL, host })) {
      return { ok: false, error: "Testni način prijave je dovoljen samo v lokalnem razvojnem okolju." };
    }
    const result = await processStatikaSignup(parsed.data, previewDependencies(parsed.data.email, parsed.data.fullName));
    return result.ok ? { ...result, preview: true } : result;
  }

  try {
    // Local preview never imports provider adapters and cannot fall through to
    // real services. Live mode never falls back to synthetic success.
    const [queries, holds, membership, brevo, lists] = await Promise.all([
      import("@/lib/sanity/queries"), import("@/lib/sanity/training-holds"),
      import("@/lib/stripe/training-membership-lookup"), import("@/lib/brevo/client"),
      import("@/lib/brevo/training-group-list"),
    ]);
    const notifyEmail = process.env.BREVO_NOTIFY_EMAIL?.trim() || siteConfig.email;
    return await processStatikaSignup(parsed.data, {
      statikaGroupId: siteConfig.trainings.statikaGroupId,
      notifyEmail, siteEmail: siteConfig.email,
      getSettings: queries.getTrainingSettings,
      getGroup: queries.getTrainingGroup,
      findMemberships: async (email, since) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          return await Promise.race([
            membership.findPaidTrainingMemberships(email, since),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Membership lookup timed out")), 4000); }),
          ]);
        } finally { clearTimeout(timer); }
      },
      confirmSpot: holds.confirmAdditionalTrainingSpot,
      addContact: async ({ group, fullName, email, phone }) => {
        const listId = await lists.findOrCreateTrainingGroupList(group._id, `Trening · ${group.venue.name} · Sreda ${group.startTime}–${group.endTime} · ${group.program.name}`);
        const { first, last } = splitName(fullName);
        await brevo.upsertContact({ email, firstName: first, lastName: last, phone, listIds: [listId] });
      },
      sendEmail: async (email) => {
        try { await brevo.sendTransactionalEmailWithReceipt(email); }
        catch (error) {
          // Brevo does not replay a receipt. Its documented duplicate response
          // means the identical keyed email was already processed, not delivered.
          if (error instanceof brevo.BrevoRequestError && isStatikaEmailReplay(error)) return;
          throw error;
        }
      },
    });
  } catch {
    return { ok: false, error: "Prijave trenutno ni mogoče oddati. Poskusite znova ali nam pišite na info@apnea.si." };
  }
}
