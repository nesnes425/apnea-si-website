import assert from "node:assert/strict";
import { test } from "node:test";
import type { TransactionalEmail } from "@/lib/brevo/client";
import { statikaSignupCustomerEmail, statikaSignupNotificationEmail } from "@/lib/brevo/emails/statika-signup";
import type { TrainingGroup } from "@/lib/sanity/types";
import { additionalGroupMarker, type PaidTrainingMembership } from "./membership-check";
import { isStatikaEmailReplay, processStatikaSignup, statikaEmailKey, statikaPreviewAllowed, type StatikaSignupDeps } from "./statika-signup";
import { statikaSignupSchema, type StatikaSignupInput } from "./statika-signup-schema";

const input: StatikaSignupInput = {
  groupId: "statika", requestId: "12345678-1234-4123-8123-123456789abc", fullName: "Testni Član",
  email: "member@example.invalid", phone: "+38640111222", membershipAlreadyPaid: true, acceptTerms: true, website: "",
};
const membership: PaidTrainingMembership = { paymentIntentId: "pi_original", groupId: "another-group", customerName: input.fullName, created: 1_790_000_000, status: "succeeded" };
function fixture() {
  const group = {
    _id: "statika", active: true, weekday: "sreda", startTime: "20:45", endTime: "21:45",
    capacity: 12, confirmedSpots: 0, holds: [], confirmedPaymentIntentIds: [],
    venue: { name: "Tivoli", active: true }, program: { name: "Statika", active: true },
  } as unknown as TrainingGroup;
  const state = { settings: { applicationsOpen: true, seasonLabel: "2026/27" }, memberships: [membership], events: [] as string[], emails: [] as TransactionalEmail[], increments: 0, adminFails: false, customerFails: false, contactFails: false, lookupFails: false };
  const deps: StatikaSignupDeps = {
    statikaGroupId: "statika", notifyEmail: "admin@example.invalid", siteEmail: "info@example.invalid",
    getSettings: async () => state.settings,
    getGroup: async () => group,
    findMemberships: async (_email, since) => {
      assert.equal(since, Date.UTC(2026, 6, 1) / 1000);
      if (state.lookupFails) throw new Error("provider unavailable");
      return state.memberships;
    },
    confirmSpot: async ({ marker }) => {
      state.events.push("confirm");
      const alreadyConfirmed = group.confirmedPaymentIntentIds.includes(marker);
      if (!alreadyConfirmed) { state.increments++; group.confirmedSpots++; group.confirmedPaymentIntentIds.push(marker); }
      return { ok: true, alreadyConfirmed };
    },
    addContact: async () => { state.events.push("contact"); if (state.contactFails) throw new Error("contact failed"); },
    sendEmail: async (email) => {
      const role = email.to.email === deps.notifyEmail ? "admin" : "customer";
      state.events.push(role); state.emails.push(email);
      if (role === "admin" ? state.adminFails : state.customerFails) throw new Error("mail failed");
    },
  };
  return { deps, state, group };
}

test("known member confirms a single place and records admin evidence before optional follow-ups", async () => {
  const { deps, state, group } = fixture();
  const result = await processStatikaSignup(input, deps);
  assert.ok(result.ok && result.kind === "confirmed" && result.customerEmailSent && result.contactAdded);
  assert.deepEqual(state.events, ["confirm", "admin", "contact", "customer"]);
  // Katarina's intake searches this exact established notification prefix.
  assert.match(state.emails[0].subject, /^Nova prijava na dodatni trening:/);
  assert.deepEqual(group.confirmedPaymentIntentIds, [additionalGroupMarker(membership.paymentIntentId)]);
  assert.match(state.emails[0].text, /Mesto v Sanityju je že upoštevano/);
  assert.match(state.emails[0].text, /Ne prestavljajte/);
  assert.match(state.emails[0].text, /tabele ne posodobi samodejno/);
  assert.notEqual(state.emails[0].idempotencyKey, state.emails[1].idempotencyKey);
});

test("admin failure preserves capacity and retry repairs notifications using the same marker and keys", async () => {
  const { deps, state, group } = fixture();
  state.adminFails = true;
  const first = await processStatikaSignup(input, deps);
  assert.ok(!first.ok && first.spotReserved);
  assert.deepEqual(state.events, ["confirm", "admin"]);
  state.adminFails = false;
  group.capacity = 1; // A now-full group must still permit a recovery replay.
  const second = await processStatikaSignup({ ...input, requestId: "aaaaaaaa-1234-4123-8123-123456789abc" }, deps);
  assert.ok(second.ok && second.kind === "confirmed");
  assert.equal(state.increments, 1);
  assert.equal(state.emails[0].idempotencyKey, state.emails[1].idempotencyKey);
  assert.deepEqual(state.events, ["confirm", "admin", "confirm", "admin", "contact", "customer"]);
});

test("unknown membership creates only an admin-first review request", async () => {
  const { deps, state } = fixture(); state.memberships = [];
  const result = await processStatikaSignup(input, deps);
  assert.ok(result.ok && result.kind === "pending_review" && !result.contactAdded);
  assert.deepEqual(state.events, ["admin", "customer"]);
  assert.equal(state.increments, 0);
  assert.match(state.emails[0].subject, /^Nova zahteva za prijavo na statiko:/);
  assert.match(state.emails[0].text, /Mesto še ni potrjeno ali rezervirano/);
  assert.match(state.emails[1].text, /Vaše mesto še ni potrjeno ali rezervirano/);
  assert.doesNotMatch(state.emails[1].text, /Vaša prijava na statiko je potrjena/);
});

test("lookup failure is pending review, never payment or a confirmed claim", async () => {
  const { deps, state } = fixture(); state.lookupFails = true;
  const result = await processStatikaSignup(input, deps);
  assert.ok(result.ok && result.kind === "pending_review");
  assert.deepEqual(state.events, ["admin", "customer"]);
  assert.match(state.emails[0].text, /preverjanje trenutno ni bilo na voljo/);
});

test("failed pending admin submission neither claims success nor emails the customer", async () => {
  const { deps, state } = fixture(); state.memberships = []; state.adminFails = true;
  const result = await processStatikaSignup(input, deps);
  assert.ok(!result.ok && !result.spotReserved);
  assert.deepEqual(state.events, ["admin"]);
});

test("pending retry preserves identical payload keys but corrected contacts with the same form UUID reach admin", async () => {
  const { deps, state } = fixture(); state.memberships = []; state.adminFails = true;
  // The provider may have accepted this request even though its response failed.
  assert.equal((await processStatikaSignup(input, deps)).ok, false);
  state.adminFails = false;
  const identical = await processStatikaSignup(input, deps);
  assert.ok(identical.ok && identical.kind === "pending_review");
  assert.equal(state.emails[0].idempotencyKey, state.emails[1].idempotencyKey);
  const corrected = await processStatikaSignup({ ...input, email: "corrected@example.invalid", phone: "+38640999888" }, deps);
  assert.ok(corrected.ok && corrected.kind === "pending_review");
  assert.notEqual(corrected.requestId, identical.requestId);
  assert.notEqual(state.emails[3].idempotencyKey, state.emails[0].idempotencyKey);
  assert.match(state.emails[3].text, /corrected@example.invalid/);
  assert.match(state.emails[3].text, /\+38640999888/);
  assert.equal(state.increments, 0);
});

test("corrected verified contact details get new email keys but retain the same registration and capacity marker", async () => {
  const { deps, state } = fixture();
  const first = await processStatikaSignup(input, deps);
  const corrected = await processStatikaSignup({ ...input, phone: "+38640999888" }, deps);
  assert.ok(first.ok && corrected.ok && corrected.kind === "confirmed");
  assert.equal(first.requestId, corrected.requestId);
  assert.equal(state.increments, 1);
  assert.notEqual(state.emails[0].idempotencyKey, state.emails[2].idempotencyKey);
  assert.match(state.emails[2].text, /\+38640999888/);
});

test("optional failures after accepted admin evidence are reported without losing the signup", async () => {
  const { deps, state } = fixture(); state.customerFails = true; state.contactFails = true;
  const result = await processStatikaSignup(input, deps);
  assert.ok(result.ok && result.kind === "confirmed" && !result.customerEmailSent && !result.contactAdded);
  assert.equal(state.increments, 1);
});

test("wrong group, inactive venue/program/group, changed time, closed or invalid season cause zero writes", async () => {
  const changes = [
    ({ group }: ReturnType<typeof fixture>) => { group.active = false; },
    ({ group }: ReturnType<typeof fixture>) => { group.venue.active = false; },
    ({ group }: ReturnType<typeof fixture>) => { group.program.active = false; },
    ({ group }: ReturnType<typeof fixture>) => { group.startTime = "20:30"; },
    ({ state }: ReturnType<typeof fixture>) => { state.settings.applicationsOpen = false; },
    ({ state }: ReturnType<typeof fixture>) => { state.settings.seasonLabel = "invalid"; },
  ];
  for (const change of changes) {
    const f = fixture(); change(f);
    assert.equal((await processStatikaSignup(input, f.deps)).ok, false);
    assert.deepEqual(f.state.events, []);
  }
  const { deps, state } = fixture();
  assert.equal((await processStatikaSignup({ ...input, groupId: "another" }, deps)).ok, false);
  assert.deepEqual(state.events, []);
});

test("full groups and active holds block both new confirmed and pending applications before writes", async () => {
  for (const paid of [true, false]) for (const held of [true, false]) {
    const { deps, group, state } = fixture();
    if (!paid) state.memberships = [];
    group.capacity = 1;
    if (held) group.holds = [{ _key: "hold", tokenHash: "hold", expiresAt: new Date(Date.now() + 60_000).toISOString() }];
    else group.confirmedSpots = 1;
    assert.equal((await processStatikaSignup(input, deps)).ok, false);
    assert.deepEqual(state.events, []);
  }
});

test("atomic capacity refusal is surfaced without emails or contacts", async () => {
  const { deps, state } = fixture();
  deps.confirmSpot = async () => ({ ok: false, reason: "full" });
  const result = await processStatikaSignup(input, deps);
  assert.ok(!result.ok && /polna/.test(result.error));
  assert.deepEqual(state.events, []);
});

test("original paid signup to the same group is not treated as a follow-up replay", async () => {
  const { deps, state } = fixture(); state.memberships = [{ ...membership, groupId: input.groupId }];
  assert.equal((await processStatikaSignup(input, deps)).ok, false);
  assert.deepEqual(state.events, []);
});

test("a different person sharing email or processing membership receives pending review", async () => {
  for (const other of [{ ...membership, customerName: "Drugi Član" }, { ...membership, status: "processing" as const }]) {
    const { deps, state } = fixture(); state.memberships = [other];
    const result = await processStatikaSignup(input, deps);
    assert.ok(result.ok && result.kind === "pending_review");
    assert.deepEqual(state.events, ["admin", "customer"]);
  }
});

test("validation requires membership declaration, terms, bounded fields, request UUID and empty honeypot", async () => {
  for (const override of [{ membershipAlreadyPaid: false }, { acceptTerms: false }, { website: "spam" }, { requestId: "invalid" }, { fullName: "x\nInjected subject" }, { phone: "1" }, { email: "invalid" }]) {
    const { deps, state } = fixture();
    assert.equal((await processStatikaSignup({ ...input, ...override }, deps)).ok, false);
    assert.deepEqual(state.events, []);
  }
  assert.equal(statikaSignupSchema.parse({ ...input, email: " MEMBER@EXAMPLE.INVALID " }).email, input.email);
});

test("provider replay handling accepts only the documented idempotency duplicate response", () => {
  const error = { status: 400, providerCode: "duplicate_parameter", message: 'Brevo failed: {"message":"Email for the idempotency key has already been processed"}' };
  assert.equal(isStatikaEmailReplay(error), true);
  assert.equal(isStatikaEmailReplay({ ...error, message: "SMS duplicate_parameter" }), false);
  assert.equal(isStatikaEmailReplay({ ...error, status: 500 }), false);
  assert.equal(isStatikaEmailReplay({ ...error, providerCode: "invalid_parameter" }), false);
});

test("idempotency keys are UUIDs, stable and distinct by recipient/role", () => {
  const first = statikaEmailKey("signup|admin|admin@example.invalid");
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(first, statikaEmailKey("signup|admin|admin@example.invalid"));
  assert.notEqual(first, statikaEmailKey("signup|customer|admin@example.invalid"));
});

test("preview gate requires explicit development mode, no Vercel and a loopback host", () => {
  const allowed = { enabled: "true", nodeEnv: "development", host: "127.0.0.1:3100" };
  assert.equal(statikaPreviewAllowed(allowed), true);
  for (const override of [{ enabled: "false" }, { nodeEnv: "production" }, { vercel: "1" }, { host: "www.apnea.si" }, { host: "localhost.attacker.test" }]) assert.equal(statikaPreviewAllowed({ ...allowed, ...override }), false);
});

test("transactional HTML escapes submitted values and contains a viewport and contact link", () => {
  const data = { ...input, fullName: "<script>test</script>", season: "2026/27", groupLabel: "Statika <test>", kind: "pending_review" as const };
  for (const email of [statikaSignupCustomerEmail(data), statikaSignupNotificationEmail(data)]) {
    assert.doesNotMatch(email.html, /<script>/);
    assert.match(email.html, /&lt;script&gt;/);
    assert.match(email.html, /name="viewport"/);
    assert.match(email.html, /href="mailto:info@apnea.si"/);
    assert.ok(Buffer.byteLength(email.html) < 100_000);
  }
});
