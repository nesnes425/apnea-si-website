import { NextResponse } from "next/server";
import { z } from "zod";
import { tuitionAdminAuthorized } from "@/lib/tuition/auth";
import { getEmailDelivery } from "@/lib/brevo/delivery";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "cache-control": "no-store" };
  if (!tuitionAdminAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("id"));
  if (!id.success) return NextResponse.json({ error: "Invalid delivery ID" }, { status: 400, headers });
  try {
    const emailDelivery = await getEmailDelivery({ id: id.data });
    return NextResponse.json({ emailDelivery }, { status: emailDelivery ? 200 : 404, headers });
  } catch { return NextResponse.json({ error: "Delivery status unavailable" }, { status: 503, headers }); }
}
