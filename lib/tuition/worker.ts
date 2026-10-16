import { sendTransactionalEmail } from "@/lib/brevo/client";
import { issueTuitionInvoice } from "@/lib/minimax/tuition-invoice";
import {
  claimPlan,
  getPayments,
  patchPayment,
  patchPlan,
  releasePlan,
  tuitionDb,
} from "./store";
import {
  assertTuitionStripe,
  cancelTuition,
  ensureSecondSchedule,
} from "./stripe";
import { processTuitionPayment, tuitionReceiptText } from "./processor";

export async function processTuitionPlan(id: string) {
  const record = await claimPlan(id);
  const problems: string[] = [];
  try {
    await assertTuitionStripe(record.manifest.mode);
    try {
      if (record.cancelled_at) {
        if (!record.cancellation_confirmed) await cancelTuition(record);
      } else await ensureSecondSchedule(record);
      await patchPlan(record, { error: null });
    } catch {
      problems.push("Stripe schedule/cancellation requires attention");
      await patchPlan(record, { error: problems[0] });
    }
    for (const payment of await getPayments(id)) {
      const save = async (patch: Partial<typeof payment>) => {
        await patchPayment(record, payment.id, patch);
        Object.assign(payment, patch);
      };
      try {
        const outcome = await processTuitionPayment(record.manifest, payment, {
          save,
          issue: () => issueTuitionInvoice(record.manifest, payment, save),
          send: async (invoice) => {
            const text = tuitionReceiptText(
              record.manifest,
              payment,
              invoice.number,
            );
            const html = text
              .replace(
                /[&<>"']/g,
                (c) =>
                  ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;",
                  })[c]!,
              )
              .replace(/\n/g, "<br>");
            await sendTransactionalEmail({
              to: {
                email: record.manifest.payer.email,
                name: record.manifest.payer.name,
              },
              subject: `Račun za vadnino – ${payment.instalment}. obrok`,
              text,
              html,
              idempotencyKey: payment.email_key,
              attachments: [
                {
                  name: invoice.pdf.fileName,
                  contentBase64: invoice.pdf.contentBase64,
                },
              ],
            });
          },
        });
        if (outcome === "uncertain")
          problems.push(
            `Reconcile Brevo delivery for ${payment.id} before resending`,
          );
      } catch {
        problems.push(`Accounting/email needs attention for ${payment.id}`);
        // Keep errors free of member data, credentials and API response bodies.
        await save({
          error: `Invoice/email processing failed (${payment.invoice_state}/${payment.email_state}); inspect Minimax/Brevo before retrying`,
        });
      }
    }
    return { processed: id, problems };
  } finally {
    await releasePlan(record);
  }
}

export async function dispatchTuition() {
  const pending = await tuitionDb<{ id: string }[]>(
    "rpc/tuition_pending_plans",
    "POST",
    {},
  );
  const results = [];
  const start = Date.now();
  for (const { id } of pending) {
    if (Date.now() - start > 20_000) break;
    try {
      results.push(await processTuitionPlan(id));
    } catch {
      results.push({
        processed: id,
        problems: ["Processing unavailable or plan busy"],
      });
    }
  }
  return results;
}
