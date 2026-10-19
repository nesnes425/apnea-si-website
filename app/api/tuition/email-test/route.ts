import { NextResponse } from "next/server";
import { tuitionAdminAuthorized } from "@/lib/tuition/auth";
import { emailTestSchema, sendInternalTuitionTest } from "@/lib/brevo/email-test";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function POST(request: Request) {
  const headers = { "cache-control": "no-store" };
  if (!tuitionAdminAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  let input;
  try {
    const text = await request.text();
    if (text.length > 2000) throw new Error("Too large");
    input = emailTestSchema.parse(JSON.parse(text));
  } catch { return NextResponse.json({ error: "Invalid test request" }, { status: 400, headers }); }
  try {
    return NextResponse.json(await sendInternalTuitionTest(input), { headers });
  } catch {
    return NextResponse.json({ error: "Test unavailable or acceptance uncertain. Inspect delivery status; never create a new test ID to retry an uncertain send." }, { status: 409, headers });
  }
}
