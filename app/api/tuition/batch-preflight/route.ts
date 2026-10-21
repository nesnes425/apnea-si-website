import {NextResponse} from "next/server";
import {tuitionAdminAuthorized} from "@/lib/tuition/auth";
import {batchPreflightSchema, collectBatchPreflight} from "@/lib/tuition/batch-preflight";
import {runtimePreflightReaders} from "@/lib/tuition/batch-preflight-runtime";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"cache-control":"private, no-store","x-robots-tag":"noindex, nofollow","referrer-policy":"no-referrer"};

// POST only transports private manifests. All downstream provider/storage calls
// are reads (the existing Minimax OAuth token exchange is authentication only).
export async function POST(request:Request) {
  if(!tuitionAdminAuthorized(request)) return NextResponse.json({error:"Unauthorized"},{status:401,headers});
  const reader=request.body?.getReader();
  let bytes=0;
  const chunks:Uint8Array[]=[];
  if(reader) {
    while(true) {
      const {value,done}=await reader.read();
      if(done) break;
      bytes+=value.byteLength;
      if(bytes>60_000) {await reader.cancel();return NextResponse.json({error:"Request too large"},{status:413,headers});}
      chunks.push(value);
    }
  }
  let body:unknown;
  try {body=JSON.parse(Buffer.concat(chunks).toString("utf8"));}
  catch {return NextResponse.json({error:"Invalid JSON"},{status:400,headers});}
  const parsed=batchPreflightSchema.safeParse(body);
  if(!parsed.success) return NextResponse.json({error:"Invalid approved batch",issues:parsed.error.issues.map(i=>({path:i.path,message:i.message}))},{status:422,headers});
  try {
    return NextResponse.json(await collectBatchPreflight(parsed.data,runtimePreflightReaders()),{headers});
  } catch {
    return NextResponse.json({error:"Preflight unavailable; no provider data was changed"},{status:503,headers});
  }
}
