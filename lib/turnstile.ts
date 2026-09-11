import { readEnv } from "@/lib/env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token || token.length > 2048) return false;

  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: readEnv("TURNSTILE_SECRET_KEY"),
      response: token,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return false;

  const result = (await response.json()) as TurnstileResponse;
  return result.success && result.action === "contact-form";
}
