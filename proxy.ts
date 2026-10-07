import { NextRequest, NextResponse } from "next/server";
import { supabase, SESSION_COOKIE, PortalApiError } from "./lib/portal/http";
import {
  REFRESH_COOKIE,
  cookieOptions,
  sessionCookieOptions,
  type DeviceSession,
} from "./lib/portal/session-cookies";

export async function proxy(request: NextRequest) {
  let access = request.cookies.get(SESSION_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return NextResponse.next();
  if (
    process.env.NODE_ENV === "development" &&
    process.env.PORTAL_LOCAL_DEMO === "true" &&
    !process.env.VERCEL &&
    access?.startsWith("local:")
  )
    return NextResponse.next();
  const clear = () => {
    for (const name of [SESSION_COOKIE, REFRESH_COOKIE])
      request.cookies.delete(name);
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    for (const name of [SESSION_COOKIE, REFRESH_COOKIE])
      response.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  try {
    let nextRefresh = refresh;
    try {
      if (!access) throw new PortalApiError(401);
      await supabase("/auth/v1/user", access);
    } catch (error) {
      if (
        !(error instanceof PortalApiError) ||
        ![401, 403].includes(error.status)
      )
        throw error;
      if (!refresh) return clear();
      const tokens = await supabase<{
        access_token: string;
        refresh_token: string;
      }>("/auth/v1/token?grant_type=refresh_token", undefined, {
        refresh_token: refresh,
      });
      access = tokens.access_token;
      nextRefresh = tokens.refresh_token;
    }
    // Prefetches must not count as human activity. No background refresh loop is used.
    const prefetch =
      request.headers.has("next-router-prefetch") ||
      request.headers.get("purpose") === "prefetch";
    const policy = await supabase<DeviceSession>(
      "/rest/v1/rpc/portal_check_device_session",
      access,
      { touch: !prefetch },
    );
    const options = sessionCookieOptions(policy);
    request.cookies.set(SESSION_COOKIE, access!);
    if (nextRefresh) request.cookies.set(REFRESH_COOKIE, nextRefresh);
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.set(SESSION_COOKIE, access!, options);
    if (nextRefresh) response.cookies.set(REFRESH_COOKIE, nextRefresh, options);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    // Temporary outages retain the session so they do not force a fresh login.
    if (
      error instanceof PortalApiError &&
      error.status < 500 &&
      error.status !== 429
    )
      return clear();
    return new NextResponse(
      "Povezava trenutno ni na voljo. Poskusite ponovno.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
export const config = { matcher: ["/trenerji/:path*"] };
