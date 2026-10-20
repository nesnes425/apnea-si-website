import example from "@/scripts/tuition-plan.example.json";
import {fingerprint, planSchema} from "@/lib/tuition/plan";
import {getPlan} from "@/lib/tuition/store";
import {upnDetails} from "@/lib/tuition/upn-details";
import {tuitionQrPng, verifyUpnImageToken} from "@/lib/tuition/upn-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "referrer-policy": "no-referrer",
};
export async function GET(_request: Request, {params}: {params: Promise<{token: string}>}) {
  try {
    const {token} = await params;
    if (token === "sample")
      return new Response(new Uint8Array(tuitionQrPng(planSchema.parse(example), true)), {headers: {...headers, "content-type": "image/png"}});
    // Verify before touching storage. A plan UUID alone never grants access.
    const grant = verifyUpnImageToken(token);
    if (!grant) return new Response(null, {status: 404, headers});
    const record = await getPlan(grant.id);
    if (!record || fingerprint(record.manifest) !== grant.fingerprint || record.manifest.mode !== "live")
      return new Response(null, {status: 404, headers});
    const details = upnDetails(record.manifest);
    if (record.invitation_channel !== "club" || record.bank_reference !== details.reference ||
        record.bank_iban !== details.iban || record.bank_amount_cents !== details.amountCents)
      return new Response(null, {status: 404, headers});
    // A read never sends, finalizes, charges or marks a message delivered.
    if (record.cancelled_at || record.cancellation_confirmed || record.first_payment_id || record.bank_state)
      return new Response(null, {status: 410, headers});
    return new Response(new Uint8Array(tuitionQrPng(record.manifest)), {headers: {...headers, "content-type": "image/png"}});
  } catch {
    return new Response(null, {status: 503, headers});
  }
}
