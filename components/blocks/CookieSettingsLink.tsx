"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/cookie-consent";

export function CookieSettingsLink({
  className,
  children = "Nastavitve piškotkov",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className}
    >
      {children}
    </button>
  );
}
