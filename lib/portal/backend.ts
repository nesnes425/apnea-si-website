import { cookies } from "next/headers";
import { demoEnabled, demoIds, readDemo } from "./demo";
import {
  type Staff,
  type Snapshot,
  visibleSnapshot,
  ljubljanaDate,
} from "./model";
import { configured, supabase, SESSION_COOKIE } from "./http";
export { configured, supabase, SESSION_COOKIE, PortalApiError } from "./http";
export async function identity(): Promise<{
  user: Staff;
  token: string;
  demo: boolean;
} | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  if (demoEnabled() && token.startsWith("local:")) {
    const data = await readDemo();
    const id =
      token === "local:admin"
        ? demoIds.admin
        : token === "local:trainer"
          ? demoIds.trainer
          : "";
    const user = data.staff.find((s) => s.id === id && s.active);
    return user ? { user, token, demo: true } : null;
  }
  if (!configured()) return null;
  try {
    await supabase("/rest/v1/rpc/portal_check_device_session", token, { touch: true });
    const auth = await supabase<{ id: string }>("/auth/v1/user", token);
    const users = await supabase<Staff[]>(
      `/rest/v1/portal_staff?id=eq.${encodeURIComponent(auth.id)}&select=id,name,role,active,welcome`,
      token,
    );
    const user = users.find((s) => s.active);
    return user ? { user, token, demo: false } : null;
  } catch {
    return null;
  }
}
export async function requireIdentity() {
  const id = await identity();
  if (!id) throw new Error("Prijavite se za dostop.");
  return id;
}
export async function snapshot() {
  const id = await requireIdentity();
  const data = id.demo
    ? visibleSnapshot(await readDemo(), id.user, ljubljanaDate())
    : await supabase<Snapshot>("/rest/v1/rpc/portal_snapshot", id.token, {});
  return { data, user: id.user, demo: id.demo };
}
