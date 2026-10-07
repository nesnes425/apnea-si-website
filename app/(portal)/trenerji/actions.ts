"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  configured,
  PortalApiError,
  identity,
  requireIdentity,
  SESSION_COOKIE,
  snapshot,
  supabase,
} from "@/lib/portal/backend";
import {
  assignDemo,
  closeDemo,
  demoEnabled,
  readDemo,
} from "@/lib/portal/demo";
import { sessionCoaches, closeSchema, type Member, type Session } from "@/lib/portal/model";
import {
  REFRESH_COOKIE,
  cookieOptions,
  sessionCookieOptions,
  type DeviceSession,
} from "@/lib/portal/session-cookies";
import { dispatchPortalComment } from "@/lib/brevo/portal-comment";
async function sameOrigin() {
  const h = await headers();
  const origin = h.get("origin"),
    host = h.get("host");
  if (!origin || new URL(origin).host !== host)
    throw new Error("Neveljaven izvor zahteve.");
}
export async function requestCode(email: string) {
  await sameOrigin();
  const parsed = z
    .string()
    .email()
    .max(254)
    .safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { error: "Vnesite veljaven e-poštni naslov." };
  if (!configured()) return { error: "Prijava še ni nastavljena." };
  try {
    await supabase("/auth/v1/otp", undefined, {
      email: parsed.data,
      create_user: false,
    });
  } catch (error) {
    // Unverified, pre-created accounts need their confirmation OTP first.
    // Registration stays disabled and responses never reveal account existence.
    if (error instanceof PortalApiError && error.status === 422) {
      try {
        await supabase("/auth/v1/resend", undefined, {
          email: parsed.data,
          type: "signup",
        });
      } catch {
        /* Keep the same response for unknown or rate-limited users. */
      }
    }
  }
  return { message: "Prijavno kodo ste prejeli na vaš email naslov. Preverite vse mape." };
}
export async function verifyCode(
  email: string,
  token: string,
  remember = false,
) {
  await sameOrigin();
  if (!z.string().email().safeParse(email).success || !/^\d{6,8}$/.test(token))
    return { error: "Preverite naslov in prijavno kodo." };
  try {
    const result = await supabase<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>("/auth/v1/verify", undefined, {
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });
    const policy = await supabase<DeviceSession>(
      "/rest/v1/rpc/portal_start_device_session",
      result.access_token,
      { remember: remember === true },
    );
    const jar = await cookies();
    const options = sessionCookieOptions(policy);
    jar.set(SESSION_COOKIE, result.access_token, options);
    jar.set(REFRESH_COOKIE, result.refresh_token, options);
    if (!(await identity())) {
      for (const name of [SESSION_COOKIE, REFRESH_COOKIE])
        (await cookies()).set(name, "", {
          httpOnly: true,
          sameSite: "strict",
          path: "/trenerji",
          maxAge: 0,
        });
      return { error: "Za ta račun dostop ni omogočen." };
    }
  } catch {
    return { error: "Koda je neveljavna ali je potekla." };
  }
  return { message: "Prijava uspešna." };
}
export async function localLogin(form: FormData) {
  await sameOrigin();
  const host = (await headers()).get("host") || "";
  if (!demoEnabled() || !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host))
    throw new Error("Lokalni test ni dostopen.");
  const role = form.get("role") === "admin" ? "admin" : "trainer";
  (await cookies()).set(SESSION_COOKIE, `local:${role}`, {
    httpOnly: true,
    sameSite: "strict",
    path: "/trenerji",
    maxAge: 3600,
  });
  redirect("/trenerji");
}
export async function logout() {
  await sameOrigin();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && !token.startsWith("local:")) {
    // Persist revocation before clearing the browser, so copied tokens stop working.
    await supabase("/rest/v1/rpc/portal_end_device_session", token, {});
    try {
      await supabase("/auth/v1/logout?scope=local", token, {});
    } catch {
      /* Portal session is already revoked. */
    }
  }
  for (const name of [SESSION_COOKIE, REFRESH_COOKIE])
    jar.set(name, "", { ...cookieOptions, maxAge: 0 });
  redirect("/trenerji");
}
export async function loadPortal() {
  return snapshot();
}
export async function finalizeSession(raw: unknown) {
  await sameOrigin();
  try {
    const id = await requireIdentity();
    const input = closeSchema.parse(raw);
    const result = id.demo
      ? await closeDemo(id.user, input)
      : await supabase<Session>("/rest/v1/rpc/portal_close_session", id.token, {
          input,
        });
    let mail = result.mail_status;
    if (!id.demo && mail === "pending") {
      try {
        mail = (await dispatchPortalComment(
          result.id,
        )) as Session["mail_status"];
      } catch {
        mail = "pending";
      }
    }
    return { ok: true as const, mail, demo: id.demo };
  } catch (e) {
    return {
      ok: false as const,
      error:
        e instanceof z.ZodError
          ? "Zapis ni veljaven. Preverite vsa polja."
          : e instanceof Error
            ? e.message
            : "Shranjevanje ni uspelo.",
    };
  }
}
export async function findMakeup(query: string, sessionId: string) {
  const id = await requireIdentity();
  if (
    query.trim().length < 3 ||
    query.length > 100 ||
    !z.string().uuid().safeParse(sessionId).success
  )
    return [];
  if (!id.demo)
    return supabase<Member[]>("/rest/v1/rpc/portal_search_members", id.token, {
      query,
      session_id: sessionId,
    });
  const data = await readDemo();
  const s = data.sessions.find((s) => s.id === sessionId);
  if (!s || (id.user.role !== "admin" && !sessionCoaches(s).includes(id.user.id)))
    throw new Error("Nimate dostopa.");
  return data.members
    .filter(
      (m) =>
        m.group_id !== s.group_id &&
        m.name.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 15);
}
export async function assignCoach(
  sessionId: string,
  coachId: string,
  version: number,
  position: "primary" | "additional" = "primary",
) {
  await sameOrigin();
  try {
    const id = await requireIdentity();
    z.string().uuid().parse(sessionId);
    z.string().uuid().parse(coachId);
    z.number().int().nonnegative().parse(version);
    z.enum(["primary", "additional"]).parse(position);
    if (id.demo) await assignDemo(id.user, sessionId, coachId, version, position);
    else
      await supabase(position === "additional" ? "/rest/v1/rpc/portal_assign_additional_coach" : "/rest/v1/rpc/portal_assign_coach", id.token, {
        session_id: sessionId,
        coach_id: coachId,
        expected_version: version,
      });
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error:
        "Dodelitev ni uspela. Osvežite stran in preverite stanje treninga.",
    };
  }
}
