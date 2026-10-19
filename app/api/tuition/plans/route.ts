import { NextResponse } from "next/server";
import { z } from "zod";
import { tuitionAdminAuthorized } from "@/lib/tuition/auth";
import { getEmailDelivery } from "@/lib/brevo/delivery";
import { fingerprint, planSchema, tuitionItem } from "@/lib/tuition/plan";
import {
  claimPlan,
  getPayments,
  getPlan,
  insertPlan,
  patchPlan,
  releasePlan,
} from "@/lib/tuition/store";
import {
  assertTuitionStripe,
  cancelTuition,
  ensureTuitionCustomer,
} from "@/lib/tuition/stripe";
import { processTuitionPlan } from "@/lib/tuition/worker";
import {prepareCombinedInvitation, sendCombinedInvitation} from "@/lib/tuition/combined-invitation";
import { tuitionInvoicePayload } from "@/lib/minimax/tuition-invoice";
import { trainingStripe } from "@/lib/stripe/training-client";
import {
  ensureFirstInvoice,
  sendFirstInvitation,
} from "@/lib/tuition/invitation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!tuitionAdminAuthorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z
    .uuid()
    .safeParse(new URL(request.url).searchParams.get("id"));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  try {
    const plan = await getPlan(parsed.data);
    if (!plan)
      return NextResponse.json({ error: "Unknown plan" }, { status: 404 });
    return NextResponse.json(
      { plan, payments: await getPayments(plan.id), emailDelivery: await getEmailDelivery({ planId: plan.id }) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Tuition storage unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!tuitionAdminAuthorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const text = await request.text();
  if (text.length > 20_000)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.action === "create") {
    const parsed = planSchema.safeParse(body.plan);
    if (!parsed.success)
      return NextResponse.json(
        {
          error: "Invalid approved plan",
          issues: parsed.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        { status: 422 },
      );
    const p = parsed.data;
    try {
      if (Date.parse(p.firstPaymentDeadline) <= Date.now() + 3600_000)
        throw new Error(
          "Payment deadline must be at least one hour in the future",
        );
      await assertTuitionStripe(p.mode);
      {
        const productId = tuitionItem(p.locationCode).stripeProductId;
        const product = await trainingStripe.products.retrieve(productId);
        if (
          !("active" in product) ||
          !product.active ||
          product.livemode !== (p.mode === "live")
        )
          throw new Error(
            "Tuition product is inactive or in the wrong Stripe mode",
          );
      }
      if (p.mode === "live") {
        if (
          process.env.MINIMAX_TUITION_ENABLED !== "true" ||
          process.env.MINIMAX_TUITION_POLICY !== "service_per_instalment"
        )
          throw new Error(
            "Minimax tuition configuration must be approved first",
          );
        tuitionInvoicePayload(
          p,
          {
            instalment: 1,
            amount_cents: p.first.amountCents,
            paid_at: new Date().toISOString(),
            id: "preflight",
          } as Parameters<typeof tuitionInvoicePayload>[1],
          1,
        );
      }
      await insertPlan(p, fingerprint(p));
      const record = await claimPlan(p.id);
      try {
        await ensureTuitionCustomer(record);
        if (record.first_payment_flow === "stripe_invoice")
          await ensureFirstInvoice(record);
      } finally {
        await releasePlan(record);
      }
      return NextResponse.json({
        id: p.id,
        mode: p.mode,
        emailSent: false,
        nextAction:
          "Review the draft, then use send with explicit recipient approval",
        paymentLink: `${process.env.TUITION_SITE_URL ?? "https://www.apnea.si"}/vadnina/${p.id}`,
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "Creation unavailable; inspect plan status and configuration before retrying. Keep the same plan/obligation IDs.",
        },
        { status: 409 },
      );
    }
  }
  const parsed = z
    .object({
      action: z.enum(["send", "send-combined", "preview-combined", "sync", "cancel"]),
      id: z.uuid(),
      reason: z.string().min(10).max(500).optional(),
    })
    .safeParse(body);
  if (
    !parsed.success ||
    (parsed.data.action === "cancel" && !parsed.data.reason)
  )
    return NextResponse.json(
      {
        error:
          "Use send/sync/cancel with a valid ID; cancellation requires a reason",
      },
      { status: 422 },
    );
  try {
    const input = parsed.data;
    if (!(await getPlan(input.id)))
      return NextResponse.json({ error: "Unknown plan" }, { status: 404 });
    if (["send", "send-combined", "preview-combined"].includes(input.action)) {
      const record = await claimPlan(input.id);
      try {
        const result = input.action === "preview-combined" ? await prepareCombinedInvitation(record)
          : input.action === "send-combined" ? await sendCombinedInvitation(record)
          : await sendFirstInvitation(record);
        return NextResponse.json({ id: input.id, ...result }, {headers: {"cache-control":"no-store"}});
      } finally {
        await releasePlan(record);
      }
    }
    if (input.action === "sync") {
      const result = await processTuitionPlan(input.id);
      return NextResponse.json(result, {
        status: result.problems.length ? 503 : 200,
      });
    }
    const record = await claimPlan(input.id);
    try {
      await patchPlan(record, { cancellation_reason: input.reason! });
      await cancelTuition(record);
    } catch (error) {
      await patchPlan(record, {
        error:
          "Cancellation pending; reconcile Stripe before confirming it to payer",
      });
      throw error;
    } finally {
      await releasePlan(record);
    }
    return NextResponse.json({
      id: input.id,
      cancelled: true,
      refunded: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Action pending; inspect status and retry" },
      { status: 503 },
    );
  }
}
