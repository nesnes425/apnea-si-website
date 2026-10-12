import { NextResponse } from "next/server";
import { dispatchPendingPortalComments } from "@/lib/brevo/portal-comment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const counts = await dispatchPendingPortalComments();
    return NextResponse.json(counts, { status: counts.errors ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: "Pošiljanje komentarjev ni na voljo." }, { status: 503 });
  }
}
