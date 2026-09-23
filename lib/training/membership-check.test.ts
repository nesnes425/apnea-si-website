import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  additionalGroupMarker,
  decideTrainingSignup,
  isSamePerson,
  seasonStartUnix,
  type PaidTrainingMembership,
} from "./membership-check";

const alenka: PaidTrainingMembership = {
  paymentIntentId: "pi_alenka_1",
  groupId: "group-nm-1900",
  customerName: "Alenka Peterlin",
  created: 1_790_020_748,
  status: "succeeded",
};

describe("decideTrainingSignup", () => {
  test("first signup of the season needs a membership payment", () => {
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-nm-1900",
        customerName: "Alenka Peterlin",
        memberships: [],
        groupConfirmedIds: [],
      }),
      { kind: "new_membership" }
    );
  });

  test("paying again for the same group is blocked", () => {
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-nm-1900",
        customerName: "alenka  peterlin",
        memberships: [alenka],
        groupConfirmedIds: [],
      }),
      { kind: "already_in_group" }
    );
  });

  test("a second group after a paid membership is free", () => {
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-dif-sreda",
        customerName: "Alenka Peterlin",
        memberships: [alenka],
        groupConfirmedIds: [],
      }),
      { kind: "additional_group", membershipPaymentIntentId: "pi_alenka_1" }
    );
  });

  test("the earliest membership payment is referenced when several exist", () => {
    const later = { ...alenka, paymentIntentId: "pi_alenka_2", groupId: "group-x", created: alenka.created + 60 };
    const decision = decideTrainingSignup({
      groupId: "group-y",
      customerName: "Alenka Peterlin",
      memberships: [later, alenka],
      groupConfirmedIds: [],
    });
    assert.deepEqual(decision, { kind: "additional_group", membershipPaymentIntentId: "pi_alenka_1" });
  });

  test("repeating a free additional-group signup is blocked", () => {
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-dif-sreda",
        customerName: "Alenka Peterlin",
        memberships: [alenka],
        groupConfirmedIds: [additionalGroupMarker("pi_alenka_1")],
      }),
      { kind: "already_in_group" }
    );
  });

  test("a child registered with a parent's email pays their own membership", () => {
    const parent = { ...alenka, customerName: "Tomaž Skrbinšek", groupId: "group-dif-sreda" };
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-mladinska",
        customerName: "Leon Skrbinšek",
        memberships: [parent],
        groupConfirmedIds: [],
      }),
      { kind: "new_membership" }
    );
  });

  test("two family members sharing an email can join the same group", () => {
    const mark = { ...alenka, customerName: "Mark Pavlič", groupId: "group-nm-2000" };
    assert.deepEqual(
      decideTrainingSignup({
        groupId: "group-nm-2000",
        customerName: "Peter Pavlič",
        memberships: [mark],
        groupConfirmedIds: [],
      }),
      { kind: "new_membership" }
    );
  });
});

test("a still-processing payment blocks the same group but grants no free group", () => {
  const pending = { ...alenka, status: "processing" as const };
  assert.deepEqual(
    decideTrainingSignup({ groupId: "group-nm-1900", customerName: "Alenka Peterlin", memberships: [pending], groupConfirmedIds: [] }),
    { kind: "already_in_group" }
  );
  assert.deepEqual(
    decideTrainingSignup({ groupId: "group-other", customerName: "Alenka Peterlin", memberships: [pending], groupConfirmedIds: [] }),
    { kind: "new_membership" }
  );
});

describe("isSamePerson", () => {
  test("ignores case, diacritics, spacing and word order", () => {
    assert.equal(isSamePerson("BOŠTJAN ZAGORC", "Bostjan  Zagorc"), true);
    assert.equal(isSamePerson("Zagorc Boštjan", "Boštjan Zagorc"), true);
  });

  test("different people and empty names never match", () => {
    assert.equal(isSamePerson("Rok Biček", "Alenka Peterlin"), false);
    assert.equal(isSamePerson("", ""), false);
  });
});

describe("seasonStartUnix", () => {
  test("season 2026/27 starts on 1 July 2026", () => {
    assert.equal(seasonStartUnix("2026/27"), Date.UTC(2026, 6, 1) / 1000);
  });

  test("an unreadable label falls back to roughly the last ten months", () => {
    const now = new Date("2026-09-22T12:00:00Z");
    const start = seasonStartUnix(undefined, now);
    assert.equal(start, Math.floor((now.getTime() - 300 * 86_400_000) / 1000));
  });
});
