import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { TrainingGroup } from "@/lib/sanity/types";
import type { TrainingPaymentEmail } from "@/lib/stripe/training-payment-processor";
import type { ConfirmAdditionalSpotResult } from "@/lib/sanity/training-holds";
import {
  processAdditionalGroupSignup,
  type AdditionalGroupSignupDeps,
} from "./additional-group-signup";

const group = {
  _id: "group-dif-sreda",
  active: true,
  weekday: "sreda",
  startTime: "20:00",
  endTime: "21:00",
  program: { name: "Nadaljevalni program" },
  venue: { name: "Fakulteta za šport", city: "Ljubljana" },
} as unknown as TrainingGroup;

const input = {
  groupId: "group-dif-sreda",
  fullName: "Ana Novak",
  email: "ana@example.com",
  phone: "+38640111222",
  membershipPaymentIntentId: "pi_membership",
};

function makeDeps(confirmResult: ConfirmAdditionalSpotResult = { ok: true, alreadyConfirmed: false }) {
  const state = {
    markers: [] as string[],
    emails: [] as TrainingPaymentEmail[],
    contacts: [] as Array<{ email: string; listIds: number[] }>,
    listNames: [] as string[],
  };
  const deps: AdditionalGroupSignupDeps = {
    getTrainingGroup: async () => group,
    confirmAdditionalTrainingSpot: async ({ marker }) => {
      state.markers.push(marker);
      return confirmResult;
    },
    findOrCreateTrainingGroupList: async (_id, name) => {
      state.listNames.push(name);
      return 118;
    },
    upsertContact: async (params) => {
      state.contacts.push({ email: params.email, listIds: params.listIds });
    },
    sendTransactionalEmail: async (email) => {
      state.emails.push(email);
    },
    notifyEmail: "admin@example.com",
    siteEmail: "info@example.com",
  };
  return { deps, state };
}

describe("processAdditionalGroupSignup", () => {
  test("reserves the spot, adds the Brevo contact and sends both emails", async () => {
    const { deps, state } = makeDeps();
    assert.deepEqual(await processAdditionalGroupSignup(input, deps), { ok: true });
    assert.deepEqual(state.markers, ["additional:pi_membership"]);
    assert.deepEqual(state.listNames, ["Trening · Fakulteta za šport · Sreda 20:00–21:00 · Nadaljevalni program"]);
    assert.deepEqual(state.contacts, [{ email: "ana@example.com", listIds: [118] }]);
    assert.equal(state.emails.length, 2);
    const customer = state.emails.find((email) => email.to.email === "ana@example.com");
    assert.ok(customer?.text.includes("že plačali"));
    assert.equal(customer?.attachments, undefined);
    const admin = state.emails.find((email) => email.to.email === "admin@example.com");
    assert.ok(admin?.text.includes("pi_membership"));
  });

  test("a full group returns a clear error and sends nothing", async () => {
    const { deps, state } = makeDeps({ ok: false, reason: "full" });
    assert.deepEqual(await processAdditionalGroupSignup(input, deps), {
      ok: false,
      error: "Izbrana skupina je polna.",
    });
    assert.equal(state.emails.length, 0);
    assert.equal(state.contacts.length, 0);
  });

  test("a concurrent duplicate submit does not send emails twice", async () => {
    const { deps, state } = makeDeps({ ok: true, alreadyConfirmed: true });
    assert.deepEqual(await processAdditionalGroupSignup(input, deps), { ok: true });
    assert.equal(state.emails.length, 0);
  });

  test("an inactive group is rejected before reserving anything", async () => {
    const { deps, state } = makeDeps();
    deps.getTrainingGroup = async () => ({ ...group, active: false }) as TrainingGroup;
    const result = await processAdditionalGroupSignup(input, deps);
    assert.equal(result.ok, false);
    assert.equal(state.markers.length, 0);
  });

  test("a failed email does not undo the confirmed spot", async () => {
    const { deps, state } = makeDeps();
    deps.sendTransactionalEmail = async () => {
      throw new Error("Brevo down");
    };
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.deepEqual(await processAdditionalGroupSignup(input, deps), { ok: true });
    } finally {
      console.error = originalError;
    }
    assert.deepEqual(state.contacts, [{ email: "ana@example.com", listIds: [118] }]);
  });
});
