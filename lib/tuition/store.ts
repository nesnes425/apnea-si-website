import { randomUUID } from "node:crypto";
import { readEnv } from "@/lib/env";
import type { TuitionPlan } from "./plan";

export type PlanRecord = {
  id: string;
  manifest: TuitionPlan;
  fingerprint: string;
  first_payment_flow?: "checkout" | "stripe_invoice";
  first_invoice_id?: string | null;
  consent_invoice_id?: string | null;
  invitation_state?: "not_sent" | "sending" | "submitted" | "uncertain";
  invitation_requested_at?: string | null;
  invitation_submitted_at?: string | null;
  customer_id: string | null;
  checkout_id: string | null;
  schedule_id: string | null;
  first_payment_id: string | null;
  cancelled_at: string | null;
  lease_token: string | null;
  lease_until: string | null;
  cancellation_confirmed: boolean;
  error: string | null;
  cancellation_reason: string | null;
  consent_session_id: string | null;
  collection_error: string | null;
  collection_invoice_id: string | null;
  created_at: string;
};
export type PaymentRecord = {
  id: string;
  plan_id: string;
  instalment: 1 | 2;
  amount_cents: number;
  paid_at: string;
  invoice_state: "pending" | "creating" | "created" | "issued" | "test_skipped";
  minimax_id: number | null;
  email_state: "pending" | "sending" | "sent" | "uncertain" | "test_skipped";
  email_key: string;
  error: string | null;
};

export async function tuitionDb<T>(
  route: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const key = readEnv("PORTAL_SUPABASE_SERVICE_KEY");
  const response = await fetch(
    `${readEnv("PORTAL_SUPABASE_URL")}/rest/v1/${route}`,
    {
      method,
      headers: {
        apikey: key,
        ...(key.startsWith("sb_secret_")
          ? {}
          : { authorization: `Bearer ${key}` }),
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok)
    throw new Error(`Tuition storage ${method} failed (${response.status})`);
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
export async function getPlan(id: string) {
  return (
    await tuitionDb<PlanRecord[]>(
      `tuition_plans?id=eq.${encodeURIComponent(id)}&limit=1`,
    )
  )[0];
}
export async function insertPlan(manifest: TuitionPlan, hash: string) {
  // The database also rejects duplicate source obligations, including a new UUID.
  try {
    await tuitionDb("tuition_plans", "POST", {
      id: manifest.id,
      manifest,
      fingerprint: hash,
      first_payment_flow: "stripe_invoice",
      source_obligation: manifest.source.obligationId,
      mode: manifest.mode,
    });
  } catch (error) {
    const existing = await getPlan(manifest.id);
    if (!existing || existing.fingerprint !== hash) throw error;
  }
  return (await getPlan(manifest.id))!;
}
export async function claimPlan(id: string) {
  const token = randomUUID();
  const rows = await tuitionDb<PlanRecord[]>("rpc/tuition_claim_plan", "POST", {
    target_id: id,
    token,
  });
  if (!rows.length) throw new Error("Plan is being processed; retry shortly");
  return rows[0];
}
export async function patchPlan(plan: PlanRecord, patch: Partial<PlanRecord>) {
  const rows = await tuitionDb<PlanRecord[]>(
    `tuition_plans?id=eq.${plan.id}&lease_token=eq.${plan.lease_token}`,
    "PATCH",
    patch,
  );
  if (rows.length !== 1) throw new Error("Plan lease lost");
  Object.assign(plan, rows[0]);
}
export async function releasePlan(plan: PlanRecord) {
  await patchPlan(plan, { lease_token: null, lease_until: null });
}
export async function getPayments(planId: string) {
  return tuitionDb<PaymentRecord[]>(
    `tuition_payments?plan_id=eq.${planId}&order=instalment.asc`,
  );
}
export async function patchPayment(
  plan: PlanRecord,
  id: string,
  patch: Partial<PaymentRecord>,
) {
  await tuitionDb("rpc/tuition_patch_payment", "POST", {
    target_plan: plan.id,
    token: plan.lease_token,
    target_payment: id,
    patch,
  });
}
export async function recordPayment(
  payment: Pick<
    PaymentRecord,
    "id" | "plan_id" | "instalment" | "amount_cents" | "paid_at"
  >,
) {
  // A unique (plan, instalment) constraint rejects a second distinct charge.
  await tuitionDb("rpc/tuition_record_payment", "POST", { payment });
}
