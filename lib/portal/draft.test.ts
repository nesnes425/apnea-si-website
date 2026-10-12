import { test } from "node:test";
import assert from "node:assert/strict";
import { draftKey, parseDraft, restoreDraft } from "./draft";
const ids = [1, 2, 3].map(n => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
const now = Date.now();
const draft = { version: 2, savedAt: now, statuses: { [ids[0]]: "present" as const }, guests: [], comment: "Unsent note" };

test("draft persists partial attendance and unsent comments, isolated by account and demo", () => {
  assert.deepEqual(parseDraft(JSON.stringify(draft), now), draft);
  assert.notEqual(draftKey(ids[0], ids[1], false), draftKey(ids[2], ids[1], false));
  assert.notEqual(draftKey(ids[0], ids[1], true), draftKey(ids[0], ids[1], false));
});
test("corrupted, expired and unsupported draft data are not restored", () => {
  assert.equal(parseDraft("{"), null);
  assert.equal(parseDraft(JSON.stringify(draft), now + 31 * 86400000), null);
  assert.equal(parseDraft(JSON.stringify({ ...draft, statuses: { [ids[0]]: "unknown" } })), null);
  assert.equal(parseDraft(JSON.stringify({ ...draft, comment: "a".repeat(4001) })), null);
});
test("restore removes departed roster entries and duplicate makeup members", () => {
  const guest = { id: ids[1], name: "Synthetic guest", group_id: ids[2] };
  const restored = restoreDraft({ ...draft, statuses: { [ids[0]]: "present", [ids[1]]: "absent", [ids[2]]: "present" }, guests: [guest, guest, { ...guest, id: ids[0] }] }, { statuses: {}, guests: [], comment: "" }, [ids[0]]);
  assert.deepEqual(restored, { statuses: { [ids[0]]: "present", [ids[1]]: "absent" }, guests: [guest], comment: draft.comment });
});
