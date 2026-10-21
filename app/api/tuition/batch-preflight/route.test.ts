import test from "node:test";
import assert from "node:assert/strict";
import {POST} from "./route";

test("read-only preflight rejects unauthenticated, malformed, oversized and incomplete requests without providers",async()=>{
  const previous=process.env.TUITION_ADMIN_KEY;
  process.env.TUITION_ADMIN_KEY="synthetic-local-test-key-longer-than-32";
  try {
    const call=(body:string,authorized=true)=>POST(new Request("http://localhost/api/tuition/batch-preflight",{method:"POST",body,headers:authorized ? {authorization:`Bearer ${process.env.TUITION_ADMIN_KEY}`}:{}}));
    assert.equal((await call("{}",false)).status,401);
    assert.equal((await call("{broken")).status,400);
    assert.equal((await call("x".repeat(60_001))).status,413);
    const invalid=await call(JSON.stringify({plans:[{id:"fake"}]}));
    assert.equal(invalid.status,422);assert.equal(invalid.headers.get("cache-control"),"private, no-store");
  } finally {
    if(previous===undefined) delete process.env.TUITION_ADMIN_KEY;else process.env.TUITION_ADMIN_KEY=previous;
  }
});
