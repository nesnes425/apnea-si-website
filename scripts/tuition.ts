// Operator client: only a scoped tuition API key is needed on Samo's computer.
// Run: npm run tuition -- preview temp/tuition-plan.json
import { readFile, mkdir, writeFile } from "node:fs/promises";
import {resolve} from "node:path";
import {
  planSchema,
  consentText,
  euro,
  fingerprint,
  invoicePaymentNotice,
} from "../lib/tuition/plan";
import { z } from "zod";

async function main() {
  const [command, input, ...flags] = process.argv.slice(2);
  const applied = flags.includes("--apply");
  const usage =
    "Use preview/create <plan.json>, status/preview-combined/send/sync <plan-uuid>, or cancel <plan-uuid> --reason <reason>. Mutations (including finalizing a combined preview) require --apply.";
  if (
    !command ||
    !input ||
    !["preview", "preview-combined", "create", "status", "send", "sync", "cancel"].includes(command)
  )
    throw new Error(usage);
  const plan = ["preview", "create"].includes(command)
    ? planSchema.parse(JSON.parse(await readFile(input, "utf8")))
    : null;
  if (plan) {
    console.log(
      JSON.stringify(
        {
          id: plan.id,
          mode: plan.mode,
          participant: plan.participant,
          payer: `${plan.payer.name} <${plan.payer.email}>`,
          first: euro(plan.first.amountCents),
          second: plan.second
            ? {
                amount: euro(plan.second.amountCents),
                at: plan.second.chargeAt,
              }
            : null,
          servicePeriods: [
            plan.first,
            ...(plan.second ? [plan.second] : []),
          ].map((p) => `${p.serviceFrom}–${p.serviceTo}`),
          firstPaymentDeadline: plan.firstPaymentDeadline,
          accounting: plan.approval.accountingPolicy,
          source: plan.source,
          approvedBy: plan.approval.approvedBy,
          fingerprint: fingerprint(plan),
          consent: consentText(plan),
          paymentNotice: invoicePaymentNotice(plan),
          agreementPreviouslySigned: plan.approval.agreementSigned,
          agreementNoticeVersion: plan.agreementNoticeVersion,
        },
        null,
        2,
      ),
    );
  }
  if (command === "preview" || (command !== "status" && !applied)) {
    console.log(
      "Preview only. No API request, payment link, invoice or email was created.",
    );
    process.exit(0);
  }
  const base = process.env.TUITION_API_URL;
  const key = process.env.TUITION_ADMIN_KEY;
  if (!base || !key)
    throw new Error(
      "Set TUITION_API_URL and TUITION_ADMIN_KEY locally; never paste keys into chat or Git.",
    );
  const url = new URL("/api/tuition/plans", base);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Tuition API requires HTTPS");
  let body: unknown;
  if (command === "create") body = { action: "create", plan };
  else {
    z.uuid().parse(input);
    if (command === "status") url.searchParams.set("id", input);
    else if (command === "cancel") {
      const index = flags.indexOf("--reason"),
        reason = index < 0 ? undefined : flags[index + 1];
      if (!reason || reason.length < 10)
        throw new Error(
          "Cancellation requires --reason with at least 10 characters",
        );
      body = { action: "cancel", id: input, reason };
    } else body = { action: command, id: input };
  }
  const response = await fetch(url, {
    method: command === "status" ? "GET" : "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(65_000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(result));
  if (command === "status") {
    const p = result.plan;
    console.log(
      JSON.stringify(
        {
          id: p.id,
          mode: p.manifest.mode,
          customer: p.customer_id,
          firstPaymentFlow: p.first_payment_flow,
          stripePaymentRequest: p.first_invoice_id,
          invitationState: p.invitation_state,
          invitationSubmittedAt: p.invitation_submitted_at,
          invitationChannel: p.invitation_channel,
          emailDelivery: result.emailDelivery,
          bankState: p.bank_state,
          bankBookedOn: p.bank_booked_on,
          firstPayment: p.first_payment_id,
          secondSchedule: p.schedule_id,
          cancellationRequested: p.cancelled_at,
          cancellationConfirmed: p.cancellation_confirmed,
          agreement: {
            previouslySigned: p.manifest.approval.agreementSigned,
            noticeVersion: p.manifest.agreementNoticeVersion ?? null,
            acceptedWithPayment: Boolean(
              p.manifest.agreementNoticeVersion &&
                p.first_payment_id &&
                (p.consent_invoice_id || p.consent_session_id),
            ),
          },
          error: p.error,
          collectionError: p.collection_error,
          collectionInvoice: p.collection_invoice_id,
          payments: result.payments,
        },
        null,
        2,
      ),
    );
  } else if (command === "preview-combined") {
    const dir = resolve("temp/tuition-previews", input);
    await mkdir(dir, {recursive: true, mode: 0o700});
    await writeFile(resolve(dir,"sporocilo.html"), result.html, {mode:0o600});
    await writeFile(resolve(dir,"sporocilo.txt"), result.text, {mode:0o600});
    await writeFile(resolve(dir,"UPN.pdf"), Buffer.from(result.attachment.contentBase64,"base64"), {mode:0o600});
    console.log(JSON.stringify({directory:dir,emailSent:false}));
  } else console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Tuition command failed",
  );
  process.exitCode = 1;
});
