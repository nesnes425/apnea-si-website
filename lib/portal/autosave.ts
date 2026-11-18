import { z } from "zod";
import { canEditAttendance, coachNames, enrolledOn, sessionRoster, type Session, type Snapshot, type Staff } from "./model";

const base = { operation_id: z.string().uuid(), actor_id: z.string().uuid(), session_id: z.string().uuid() };
export const changeSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("attendance"), member_id: z.string().uuid(),
    value: z.enum(["present", "absent", "remove"]), expected: z.enum(["present", "absent"]).nullable() }),
  z.object({ ...base, type: z.literal("comment"), value: z.string().trim().min(1).max(4000), expected: z.string().max(4000) }),
]);
export type AttendanceChange = z.infer<typeof changeSchema>;
export type SaveResult = { ok: true; session: Session } | { ok: false; error: string; retryable?: boolean; conflict?: boolean; session?: Session };
export const conflictMessage = "Ta vnos je medtem spremenil drug trener. Preverite njegovo vrednost in izberite, katero želite obdržati.";

// Local synthetic mode and unit tests mirror the transaction's per-member patch semantics.
export function applyAttendanceChange(data: Snapshot, user: Staff, input: AttendanceChange, today: string, now = new Date()): SaveResult {
  const s = data.sessions.find(s => s.id === input.session_id);
  if (input.actor_id !== user.id || !s || !canEditAttendance(s, user, today, now))
    return { ok: false, error: "Vnos ni dovoljen. Preverite dostop in rok 7 dni od prvega shranjevanja." };
  const next = { ...s, version: s.version + 1 };
  if (input.type === "comment") {
    if (s.comment !== input.expected) return { ok: false, conflict: true, error: conflictMessage, session: s };
    next.comment = input.value;
    if (s.comment !== input.value) {
      next.mail_status = "pending";
      next.mail_subject = `${coachNames(s, data.staff)}, ${data.groups.find(g => g.id === s.group_id)?.label}, ${s.date.split("-").reverse().join(". ")}`;
    }
  } else {
    const current = s.entries.find(e => e.member_id === input.member_id);
    if ((current?.status ?? null) !== input.expected)
      return { ok: false, conflict: true, error: conflictMessage, session: s };
    const roster = sessionRoster(data, s);
    const regular = roster.find(m => m.id === input.member_id);
    const member = regular || data.members.find(m => m.id === input.member_id);
    const season = data.groups.find(g => g.id === s.group_id)?.season;
    if (!member || (!regular && !current && !data.groups.some(g => g.season === season && enrolledOn(data, member.id, g.id, s.date))))
      return { ok: false, error: "Član za ta datum ni vključen v sezono." };
    if (input.value === "remove" && regular) return { ok: false, error: "Rednega člana ni mogoče odstraniti." };
    next.attendance_roster = roster;
    next.entries = s.entries.filter(e => e.member_id !== input.member_id);
    if (input.value !== "remove") next.entries.push({ member_id: member.id, name: current?.name || member.name, kind: regular ? "regular" : "makeup", status: input.value });
    next.first_saved_at = s.first_saved_at || (s.status === "closed" ? null : now.toISOString());
    next.status = roster.every(m => next.entries.some(e => e.member_id === m.id)) ? "closed" : "planned";
  }
  return { ok: true, session: next };
}
