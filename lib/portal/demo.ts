import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  closeSession,
  type Snapshot,
  type Staff,
  type Session,
  ljubljanaDate,
} from "./model";
export const demoIds = {
  admin: "00000000-0000-4000-8000-000000000001",
  trainer: "00000000-0000-4000-8000-000000000002",
  group: "00000000-0000-4000-8000-000000000003",
};
export function demoEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.PORTAL_LOCAL_DEMO === "true" &&
    !process.env.VERCEL
  );
}
function guard() {
  if (!demoEnabled()) throw new Error("Lokalni test ni omogočen.");
}
const dir = path.join(process.cwd(), ".portal-local");
const file = path.join(dir, "demo.json");
function seed(): Snapshot {
  const today = ljubljanaDate();
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 5) % 7));
  const date = d.toISOString().slice(0, 10);
  return {
    staff: [
      {
        id: demoIds.admin,
        name: "Testni skrbnik",
        welcome: "Dobrodošel",
        role: "admin",
        active: true,
      },
      {
        id: demoIds.trainer,
        name: "Testna trenerka",
        welcome: "Dobrodošla",
        role: "trainer",
        active: true,
      },
    ],
    groups: [
      {
        id: demoIds.group,
        label: "Ilirija · torek 21–22",
        season: "2026/27",
        level: "Nadaljevalni",
      },
      {
        id: "00000000-0000-4000-8000-000000000004",
        label: "Testna druga skupina",
        season: "2026/27",
        level: "Začetni",
      },
    ],
    members: Array.from({ length: 14 }, (_, i) => ({
      id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      name: `Testni član ${String(i + 1).padStart(2, "0")}`,
      group_id:
        i === 13 ? "00000000-0000-4000-8000-000000000004" : demoIds.group,
    })),
    sessions: [0, 7, 14].map((offset, i) => {
      const day = new Date(date + "T12:00:00Z");
      day.setUTCDate(day.getUTCDate() + offset);
      return {
        id: `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        group_id: demoIds.group,
        date: day.toISOString().slice(0, 10),
        starts: "21:00",
        ends: "22:00",
        regular_coach_id: demoIds.trainer,
        coach_id: demoIds.trainer,
        status: "planned",
        entries: [],
        comment: "",
        version: 0,
        mail_status: "none",
        mail_subject: null,
      };
    }),
    programs: [],
  };
}
async function write(data: Snapshot) {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const temp = file + "." + randomUUID();
  await writeFile(temp, JSON.stringify(data), { mode: 0o600 });
  await rename(temp, file);
}
export async function readDemo() {
  guard();
  try {
    return JSON.parse(await readFile(file, "utf8")) as Snapshot;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    const data = seed();
    await write(data);
    return data;
  }
}
let queue = Promise.resolve();
export async function mutateDemo<T>(fn: (data: Snapshot) => T): Promise<T> {
  guard();
  let result!: T;
  const task = queue.then(async () => {
    const data = await readDemo();
    result = fn(data);
    await write(data);
  });
  queue = task.catch(() => {});
  await task;
  return result;
}
export async function closeDemo(user: Staff, raw: unknown) {
  return mutateDemo((data) => {
    const next = closeSession(data, user, raw, ljubljanaDate());
    data.sessions = data.sessions.map((s) => (s.id === next.id ? next : s));
    return next;
  });
}
export async function assignDemo(
  user: Staff,
  id: string,
  coach: string,
  version: number,
  position: "primary" | "additional" = "primary",
) {
  return mutateDemo((data) => {
    const s = data.sessions.find((s) => s.id === id);
    if (
      !s ||
      !user.active ||
      (user.role !== "admin" && !(s.coach_ids || [s.coach_id]).includes(user.id)) ||
      s.version !== version ||
      s.status !== "planned" ||
      !data.staff.some((c) => c.id === coach && c.active)
    )
      throw new Error("Treninga ni mogoče spremeniti.");
    const coaches = [...(s.coach_ids || [s.coach_id])];
    const index = position === "primary" ? 0 : 1;
    if (!coaches[index] || coaches.some((id, i) => i !== index && id === coach)) throw new Error("Neveljaven izvajalec.");
    coaches[index] = coach;
    s.coach_ids = coaches;
    s.coach_id = coaches[0];
    s.version++;
    return s as Session;
  });
}
