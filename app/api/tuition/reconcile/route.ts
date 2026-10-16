import { NextResponse } from "next/server";
import { dispatchTuition } from "@/lib/tuition/worker";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.TUITION_ENABLED !== "true")
    return NextResponse.json({ enabled: false });
  try {
    const results = await dispatchTuition();
    return NextResponse.json(
      { results },
      { status: results.some((r) => r.problems.length) ? 503 : 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Tuition reconciliation unavailable" },
      { status: 503 },
    );
  }
}
