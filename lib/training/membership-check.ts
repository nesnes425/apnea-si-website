// Decides whether a training signup needs a new membership payment.
// The annual membership is paid once per person per season: a second group is
// free, and the same group must never be paid for twice.

export type PaidTrainingMembership = {
  paymentIntentId: string;
  groupId: string;
  customerName: string;
  created: number;
  // "processing" payments (e.g. awaiting bank confirmation) block a repeat
  // payment for the same group but never grant a free additional group.
  status: "succeeded" | "processing";
};

export type TrainingSignupDecision =
  | { kind: "new_membership" }
  | { kind: "already_in_group" }
  | { kind: "additional_group"; membershipPaymentIntentId: string };

// Marker stored in trainingGroup.confirmedPaymentIntentIds for a free
// additional-group signup, so a repeated submit cannot take a second spot.
export function additionalGroupMarker(membershipPaymentIntentId: string) {
  return `additional:${membershipPaymentIntentId}`;
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

// Parents register children with their own email and families share one
// address, so a matching email alone does not identify the same person.
export function isSamePerson(a: string, b: string) {
  const left = normalizeName(a);
  return left.length > 0 && left === normalizeName(b);
}

// Season "2026/27" runs from July 2026, when registrations open.
export function seasonStartUnix(seasonLabel: string | undefined, now = new Date()) {
  const year = Number(seasonLabel?.match(/(\d{4})/)?.[1]);
  const start = Number.isFinite(year)
    ? new Date(Date.UTC(year, 6, 1))
    : new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000);
  return Math.floor(start.getTime() / 1000);
}

export function decideTrainingSignup(params: {
  groupId: string;
  customerName: string;
  memberships: PaidTrainingMembership[];
  groupConfirmedIds: string[];
}): TrainingSignupDecision {
  const own = params.memberships
    .filter((membership) => isSamePerson(membership.customerName, params.customerName))
    .sort((a, b) => a.created - b.created);

  const paidForThisGroup = own.some((membership) => membership.groupId === params.groupId);
  const addedToThisGroup = own.some((membership) =>
    params.groupConfirmedIds.includes(additionalGroupMarker(membership.paymentIntentId))
  );
  if (paidForThisGroup || addedToThisGroup) return { kind: "already_in_group" };

  const paid = own.find((membership) => membership.status === "succeeded");
  if (!paid) return { kind: "new_membership" };
  return { kind: "additional_group", membershipPaymentIntentId: paid.paymentIntentId };
}
