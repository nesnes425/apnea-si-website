import { z } from "zod";

export const draftSchema = z.object({
  version: z.number().int().nonnegative(),
  savedAt: z.number(),
  statuses: z.record(z.string().uuid(), z.enum(["present", "absent"])),
  guests: z.array(z.object({ id: z.string().uuid(), name: z.string().max(200), group_id: z.string() })).max(100),
  comment: z.string().max(4000),
});
export type AttendanceDraft = z.infer<typeof draftSchema>;
export type DraftValues = Pick<AttendanceDraft, "statuses" | "guests" | "comment">;
export const draftKey = (userId: string, sessionId: string, demo: boolean) =>
  `apnea-attendance-draft:${demo ? "demo" : "live"}:${userId}:${sessionId}`;
export function parseDraft(raw: string | null, now = Date.now()): AttendanceDraft | null {
  if (!raw) return null;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || parsed.data.savedAt > now + 60000 || now - parsed.data.savedAt > 30 * 86400000)
      return null;
    return parsed.data;
  } catch { return null; }
}

export function restoreDraft(draft: AttendanceDraft, initial: DraftValues, rosterIds: string[]): DraftValues {
  const roster = new Set(rosterIds);
  const guests = draft.guests.filter((guest, index, all) =>
    !roster.has(guest.id) && all.findIndex(other => other.id === guest.id) === index);
  const allowed = new Set([...roster, ...guests.map(guest => guest.id)]);
  return {
    statuses: Object.fromEntries(Object.entries({ ...initial.statuses, ...draft.statuses }).filter(([id]) => allowed.has(id))),
    guests,
    comment: draft.comment,
  };
}
