export const SESSION_COOKIE = "apnea-portal-session";
export function configured() {
  return Boolean(
    process.env.PORTAL_SUPABASE_URL && process.env.PORTAL_SUPABASE_ANON_KEY,
  );
}
export class PortalApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
  ) {
    super(
      status === 401 || status === 403
        ? "Prijavite se ponovno oziroma preverite dostop."
        : "Zahteva ni uspela. Preverite podatke ali osvežite stran.",
    );
  }
}
export async function supabase<T>(
  route: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const url = process.env.PORTAL_SUPABASE_URL,
    key = process.env.PORTAL_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Portal še ni povezan z zasebno bazo.");
  const res = await fetch(`${url}${route}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey:
        token && token === process.env.PORTAL_SUPABASE_SERVICE_KEY
          ? token
          : key,
      ...(token && !token.startsWith("sb_secret_")
        ? { Authorization: `Bearer ${token}` }
        : {}),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new PortalApiError(res.status, error.error_code || error.code);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
