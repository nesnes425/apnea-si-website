import { z } from "zod";
export type Staff = {
  welcome?: "Dobrodošla" | "Dobrodošel";
  id: string;
  name: string;
  role: "admin" | "trainer";
  active: boolean;
};
export type Group = {
  id: string;
  label: string;
  season: string;
  level: string;
};
export type Member = { id: string; name: string; group_id: string };
export type Entry = {
  member_id: string;
  name: string;
  status: "present" | "absent";
  kind: "regular" | "makeup";
};
export type Session = {
  coach_ids?: string[];
  regular_coach_ids?: string[];
  id: string;
  group_id: string;
  date: string;
  starts: string;
  ends: string;
  regular_coach_id: string;
  coach_id: string;
  status: "planned" | "closed" | "cancelled";
  entries: Entry[];
  comment: string;
  version: number;
  mail_status: "none" | "pending" | "sent" | "failed" | "uncertain";
  mail_subject: string | null;
};
export function orderedSessions(sessions: Session[], now = new Date()) {
  // Compare scheduled local times in Slovenia, regardless of the device timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const localNow = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`);
  const start = (s: Session) => Date.parse(`${s.date}T${s.starts.slice(0, 5)}:00Z`);
  const distance = (s: Session) => {
    const end = Date.parse(`${s.date}T${s.ends.slice(0, 5)}:00Z`);
    return Math.max(start(s) - localNow, localNow - end, 0);
  };
  return [...sessions].sort((a, b) =>
    Number(a.status === "cancelled") - Number(b.status === "cancelled") ||
    distance(a) - distance(b) || start(b) - start(a) || a.id.localeCompare(b.id));
}
// Retain the trainer's choice until reassignment removes it from their scope.
export function selectedSession(sessions: Session[], currentId: string, now = new Date()) {
  return sessions.find(s => s.id === currentId) || orderedSessions(sessions, now)[0];
}
export const sessionCoaches = (s: Session) => [...new Set(s.coach_ids || [s.coach_id])];
export const regularCoaches = (s: Session) => [...new Set(s.regular_coach_ids || [s.regular_coach_id])];
export const coachNames = (s: Session, staff: Staff[]) => sessionCoaches(s).map(id => staff.find(c => c.id === id)?.name || "—").join(" in ");
export type Program = {
  id: string;
  level: "beginner" | "advanced" | "performance";
  valid_from: string;
  valid_until: string;
  content: string;
  published: boolean;
};
export type Membership = { member_id: string; group_id: string; valid_from: string; valid_until: string | null };
export type Snapshot = {
  memberships?: Membership[];
  staff: Staff[];
  groups: Group[];
  members: Member[];
  sessions: Session[];
  programs: Program[];
};
export function enrolledOn(data: Snapshot, memberId: string, groupId: string, date: string) {
  if (!data.memberships) return data.members.some(m => m.id === memberId && m.group_id === groupId);
  return data.memberships.some(e => e.member_id === memberId && e.group_id === groupId && e.valid_from <= date && (!e.valid_until || date <= e.valid_until));
}
export function sessionRoster(data: Snapshot, session: Session): Member[] {
  if (session.status === "closed") return session.entries.filter(e => e.kind === "regular").map(e => ({ id: e.member_id, name: e.name, group_id: session.group_id }));
  return data.members.filter(m => enrolledOn(data, m.id, session.group_id, session.date));
}
export const closeSchema = z.object({
  session_id: z.string().uuid(),
  version: z.number().int().min(0),
  comment: z.string().trim().max(4000),
  entries: z
    .array(
      z.object({
        member_id: z.string().uuid(),
        status: z.enum(["present", "absent"]),
        kind: z.enum(["regular", "makeup"]),
      }),
    )
    .max(100),
});
export type CloseInput = z.infer<typeof closeSchema>;
export function ljubljanaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Ljubljana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function currentPrograms(programs: Program[], today: string) {
  return programs.filter(
    (p) => p.published && p.valid_from <= today && p.valid_until >= today,
  );
}
export function requireActive(user: Staff) {
  if (!user.active) throw new Error("Dostop je onemogočen.");
}
export function visibleSnapshot(
  data: Snapshot,
  user: Staff,
  today: string,
): Snapshot {
  requireActive(user);
  const sessions =
    user.role === "admin"
      ? data.sessions
      : data.sessions.filter((s) => sessionCoaches(s).includes(user.id));
  const groupIds = new Set(sessions.map((s) => s.group_id));
  return {
    staff: data.staff.filter((s) => s.active || user.role === "admin"),
    groups:
      user.role === "admin"
        ? data.groups
        : data.groups.filter((g) => groupIds.has(g.id)),
    members:
      user.role === "admin"
        ? data.members
        : data.members.filter((m) => sessions.some(s => enrolledOn(data,m.id,s.group_id,s.date) || s.entries.some(e => e.member_id === m.id))),
    memberships: data.memberships?.filter(e => user.role === "admin" || sessions.some(s => s.group_id === e.group_id && e.valid_from <= s.date && (!e.valid_until || s.date <= e.valid_until))),
    sessions,
    programs: currentPrograms(data.programs, today),
  };
}
export function closeSession(
  data: Snapshot,
  user: Staff,
  raw: unknown,
  today: string,
): Session {
  requireActive(user);
  const input = closeSchema.parse(raw);
  const s = data.sessions.find((s) => s.id === input.session_id);
  if (!s || (user.role !== "admin" && !sessionCoaches(s).includes(user.id)))
    throw new Error("Nimate dostopa do tega treninga.");
  if (s.version !== input.version)
    throw new Error("Evidenco je nekdo že spremenil. Osvežite stran.");
  if (s.status === "cancelled" || s.date > today)
    throw new Error(
      "Prihodnjega ali odpovedanega treninga ni mogoče zaključiti.",
    );
  if (s.status === "closed" && user.role !== "admin")
    throw new Error("Popravek zaključene evidence naj uredi vodstvo.");
  const ids = input.entries.map((e) => e.member_id);
  if (new Set(ids).size !== ids.length)
    throw new Error("Član je dodan večkrat.");
  const roster = sessionRoster(data, s);
  if (
    roster.some(
      (m) =>
        !input.entries.some(
          (e) => e.member_id === m.id && e.kind === "regular",
        ),
    )
  )
    throw new Error("Označite vse člane skupine.");
  const entries = input.entries.map((e) => {
    const m = data.members.find((m) => m.id === e.member_id);
    if (!m || (e.kind === "regular") !== (roster.some(r => r.id === m.id)))
      throw new Error("Neveljaven član ali nadomeščanje.");
    return { ...e, name: m.name };
  });
  const coach = data.staff.find((c) => c.id === s.coach_id);
  const group = data.groups.find((g) => g.id === s.group_id);
  if (!coach || !group || sessionCoaches(s).some(id => !data.staff.some(c => c.id === id && (c.active || (s.status === "closed" && user.role === "admin")))))
    throw new Error("Manjka izvajalec ali skupina.");
  const commentChanged = input.comment !== s.comment;
  return {
    ...s,
    entries,
    comment: input.comment,
    status: "closed",
    version: s.version + 1,
    mail_status: input.comment
      ? s.status !== "closed" || commentChanged
        ? "pending"
        : s.mail_status
      : "none",
    mail_subject: input.comment
      ? `${coachNames(s, data.staff)}, ${group.label}, ${s.date.split("-").reverse().join(". ")}`
      : null,
  };
}
export function coachHours(sessions: Session[], id: string) {
  return sessions
    .filter((s) => s.status === "closed" && sessionCoaches(s).includes(id))
    .reduce(
      (a, s) => {
        const mins = (v: string) =>
          Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
        const hours = (mins(s.ends) - mins(s.starts)) / 60;
        return {
          ...a,
          [regularCoaches(s).includes(id) ? "regular" : "makeup"]:
            a[regularCoaches(s).includes(id) ? "regular" : "makeup"] + hours,
        };
      },
      { regular: 0, makeup: 0 },
    );
}
