export type ConsentState = {
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_NAME = "apnea_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function parseConsent(value: string | undefined): ConsentState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (
      typeof parsed?.analytics === "boolean" &&
      typeof parsed?.marketing === "boolean"
    ) {
      return parsed;
    }
  } catch {
    // Invalid or stale consent cookies are treated as no consent.
  }
  return null;
}

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  if (!match) return null;
  return parseConsent(match[1]);
}

export function writeConsent(consent: ConsentState): void {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(consent));
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${ONE_YEAR_SECONDS}; path=/; samesite=lax${secure}`;
}

export const OPEN_CONSENT_EVENT = "open-cookie-consent";
