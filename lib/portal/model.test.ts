import { test } from "node:test";
import assert from "node:assert/strict";
import {
  closeSession,
  visibleSnapshot,
  coachHours,
  type Snapshot,
  type Staff,
} from "./model";
const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
];
const trainer: Staff = {
  id: ids[0],
  name: "Trener",
  role: "trainer",
  active: true,
};
const admin: Staff = {
  id: ids[1],
  name: "Vodstvo",
  role: "admin",
  active: true,
};
function data(): Snapshot {
  return {
    staff: [trainer, admin],
    groups: [
      { id: "group", label: "Test", season: "2026/27", level: "Nadaljevalni" },
    ],
    members: [{ id: ids[2], name: "Član", group_id: "group" }],
    sessions: [
      {
        id: ids[2],
        group_id: "group",
        date: "2026-10-06",
        starts: "21:00",
        ends: "22:00",
        regular_coach_id: trainer.id,
        coach_id: trainer.id,
        status: "planned",
        entries: [],
        comment: "",
        version: 0,
        mail_status: "none",
        mail_subject: null,
      },
    ],
    programs: [
      {
        id: "old",
        level: "beginner",
        valid_from: "2026-09-01",
        valid_until: "2026-09-07",
        content: "private",
        published: true,
      },
      {
        id: "current",
        level: "advanced",
        valid_from: "2026-10-05",
        valid_until: "2026-10-11",
        content: "current",
        published: true,
      },
      {
        id: "draft",
        level: "performance",
        valid_from: "2026-10-05",
        valid_until: "2026-10-11",
        content: "draft",
        published: false,
      },
    ],
  };
}
const input = {
  session_id: ids[2],
  version: 0,
  comment: "Komentar",
  entries: [{ member_id: ids[2], status: "present", kind: "regular" }],
};
test("trainer never receives old or draft programs or another coach sessions", () => {
  const d = data();
  d.sessions[0].coach_id = admin.id;
  const result = visibleSnapshot(d, trainer, "2026-10-06");
  assert.equal(result.sessions.length, 0);
  assert.equal(result.members.length, 0);
  assert.deepEqual(
    result.programs.map((p) => p.id),
    ["current"],
  );
});
test("closed attendance, mail intent and hours belong to actual substitute", () => {
  const d = data();
  d.sessions[0].coach_id = admin.id;
  const s = closeSession(d, admin, input, "2026-10-06");
  assert.equal(s.mail_status, "pending");
  assert.match(s.mail_subject!, /^Vodstvo, Test,/);
  assert.deepEqual(coachHours([s], admin.id), { regular: 0, makeup: 1 });
  assert.deepEqual(coachHours([s], trainer.id), { regular: 0, makeup: 0 });
});
test("rejects cross-coach edits, stale versions, future dates, missing and duplicate attendance", () => {
  assert.throws(() =>
    closeSession(data(), { ...trainer, id: "other" }, input, "2026-10-06"),
  );
  assert.throws(() =>
    closeSession(data(), trainer, { ...input, version: 1 }, "2026-10-06"),
  );
  assert.throws(() => closeSession(data(), trainer, input, "2026-10-05"));
  assert.throws(() =>
    closeSession(data(), trainer, { ...input, entries: [] }, "2026-10-06"),
  );
  assert.throws(() =>
    closeSession(
      data(),
      trainer,
      { ...input, entries: [...input.entries, ...input.entries] },
      "2026-10-06",
    ),
  );
});
test("revoked staff cannot read or write", () => {
  assert.throws(() =>
    visibleSnapshot(data(), { ...trainer, active: false }, "2026-10-06"),
  );
  assert.throws(() =>
    closeSession(data(), { ...trainer, active: false }, input, "2026-10-06"),
  );
});
test("whitespace comment does not enqueue email; retry cannot duplicate finalization", () => {
  const d = data();
  const s = closeSession(d, trainer, { ...input, comment: "  " }, "2026-10-06");
  assert.equal(s.mail_status, "none");
  d.sessions = [s];
  assert.throws(() => closeSession(d, trainer, input, "2026-10-06"));
});

test('dated memberships preserve transfers, late joins and closed rosters', async () => {
  const { enrolledOn, sessionRoster } = await import('./model');
  const d=data(),m=d.members[0],s=d.sessions[0];
  d.memberships=[{member_id:m.id,group_id:'group',valid_from:'2026-10-05',valid_until:'2026-10-12'},{member_id:m.id,group_id:'new-group',valid_from:'2026-10-12',valid_until:null}];
  assert.equal(enrolledOn(d,m.id,'group','2026-10-04'),false);
  assert.equal(enrolledOn(d,m.id,'group','2026-10-12'),true);
  assert.equal(enrolledOn(d,m.id,'group','2026-10-13'),false);
  assert.equal(enrolledOn(d,m.id,'new-group','2026-10-11'),false);
  assert.equal(enrolledOn(d,m.id,'new-group','2026-10-12'),true);
  assert.equal(sessionRoster(d,{...s,date:'2026-10-13'}).length,0);
  assert.equal(sessionRoster(d,{...s,date:'2026-10-13',status:'closed',entries:[{member_id:m.id,name:'Original name',status:'present',kind:'regular'}]})[0].name,'Original name');
});

test('both regular coaches see one shared roster and each earns one hour', () => {
  const d=data();
  const second={...trainer,id:'00000000-0000-4000-8000-000000000009',name:'Drugi trener'};
  d.staff.push(second);
  const s=d.sessions[0];s.coach_ids=[trainer.id,second.id];s.regular_coach_ids=[trainer.id,second.id];
  assert.equal(visibleSnapshot(d,second,'2026-10-06').sessions.length,1);
  assert.deepEqual(visibleSnapshot(d,trainer,'2026-10-06').members,visibleSnapshot(d,second,'2026-10-06').members);
  const closed=closeSession(d,second,{session_id:s.id,version:s.version,comment:'',entries:[{member_id:d.members[0].id,status:'present',kind:'regular'}]},'2026-10-06');
  assert.deepEqual(coachHours([closed],trainer.id),{regular:1,makeup:0});
  assert.deepEqual(coachHours([closed],second.id),{regular:1,makeup:0});
  const substitute={...closed,coach_ids:[trainer.id,admin.id]};
  assert.deepEqual(coachHours([substitute],second.id),{regular:0,makeup:0});
  assert.deepEqual(coachHours([substitute],admin.id),{regular:0,makeup:1});
});
