export const REFRESH_COOKIE = "apnea-portal-refresh";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/trenerji",
};
export type DeviceSession = { expires_at: string; remembered: boolean };
export function sessionCookieOptions(policy: DeviceSession, now = Date.now()) {
  return {
    ...cookieOptions,
    ...(policy.remembered
      ? {
          maxAge: Math.max(
            0,
            Math.floor((Date.parse(policy.expires_at) - now) / 1000),
          ),
        }
      : {}),
  };
}
