import { z } from "zod";
import { configured, PortalApiError, supabase } from "./http";

export type CodeResult = {
  message?: string;
  error?: string;
  retryAfter?: number;
};
const codeSentResponse = (): CodeResult => ({
  message: "Prijavno kodo ste prejeli na vaš email naslov. Preverite vse mape.",
  retryAfter: 60,
});

function deliveryError(error: unknown): CodeResult {
  if (error instanceof PortalApiError && error.status === 429) {
    return {
      error: "Preveč zahtev za prijavno kodo. Počakajte vsaj minuto in poskusite ponovno.",
      retryAfter: 60,
    };
  }
  return { error: "Pošiljanje kode trenutno ni uspelo. Poskusite ponovno čez nekaj trenutkov." };
}

export async function sendLoginCode(email: string): Promise<CodeResult> {
  const parsed = z.string().email().max(254).safeParse(email.trim().toLowerCase());
  if (!parsed.success) return { error: "Vnesite veljaven e-poštni naslov." };
  if (!configured()) return { error: "Prijava še ni nastavljena." };
  try {
    await supabase("/auth/v1/otp", undefined, { email: parsed.data, create_user: false });
  } catch (error) {
    if (error instanceof PortalApiError &&
        ["signup_disabled", "user_not_found"].includes(error.code || ""))
      return codeSentResponse();
    if (!(error instanceof PortalApiError) || error.status !== 422)
      return deliveryError(error);
    // Pre-created accounts need confirmation first. Unknown addresses get the
    // same response so that the form does not disclose the staff directory.
    try {
      await supabase("/auth/v1/resend", undefined, { email: parsed.data, type: "signup" });
    } catch (resendError) {
      if (!(resendError instanceof PortalApiError) ||
          ![400, 422].includes(resendError.status)) return deliveryError(resendError);
    }
  }
  return codeSentResponse();
}
