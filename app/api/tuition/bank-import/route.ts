import {NextResponse} from "next/server";
import {tuitionAdminAuthorized} from "@/lib/tuition/auth";
import {bankImportSchema} from "@/lib/tuition/bank-model";
import {importBankStatement} from "@/lib/tuition/bank";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!tuitionAdminAuthorized(request)) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  const raw = await request.text();
  if (raw.length > 1_500_000) return NextResponse.json({error: "File too large"}, {status: 413});
  try {
    const schema = bankImportSchema.extend({apply: (await import("zod")).z.boolean()});
    const {apply, ...input} = schema.parse(JSON.parse(raw));
    return NextResponse.json(await importBankStatement(input, apply), {headers: {"cache-control": "no-store"}});
  } catch { return NextResponse.json({error: "Import unavailable or invalid. Inspect status; preserve the original file."}, {status: 409}); }
}
