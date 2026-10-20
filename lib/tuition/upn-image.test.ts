import test, {type TestContext} from "node:test";
import assert from "node:assert/strict";
import {inflateSync} from "node:zlib";
import example from "@/scripts/tuition-plan.example.json";
import {planSchema, fingerprint} from "./plan";
import {upnDetails} from "./upn-details";
import {tuitionQrMatrix} from "./upn-qr";
import {tuitionQrPng, upnImageUrl, verifyUpnImageToken} from "./upn-image";
import {combinedInvitation} from "./combined-template";
import {GET} from "@/app/api/tuition/upn-qr/[token]/route";
function setEnv(t: TestContext, name: string, value: string) {
  const original = process.env[name];
  process.env[name] = value;
  t.after(() => {if (original === undefined) delete process.env[name]; else process.env[name] = original;});
}
const plan = planSchema.parse({...example, mode:"live"});
const key = "synthetic-image-signing-key-not-a-real-secret";
const getToken = () => new URL(upnImageUrl(plan)).pathname.split("/").at(-1)!;
const request = (token: string) => GET(new Request("http://localhost/"), {params: Promise.resolve({token})});

test("QR PNG pixels exactly match the PDF QR matrix, including quiet zone", () => {
  for (const sample of [true, false]) {
    const png = tuitionQrPng(plan, sample), qr = tuitionQrMatrix(plan, sample);
    assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16),510);
    assert.equal(png.readUInt32BE(20),510);
    const chunks: Buffer[] = [];
    for (let offset = 8; offset < png.length;) {
      const length = png.readUInt32BE(offset), type = png.subarray(offset+4,offset+8).toString();
      if (type === "IDAT") chunks.push(png.subarray(offset+8,offset+8+length));
      offset += length+12;
    }
    const pixels = inflateSync(Buffer.concat(chunks));
    assert.equal(pixels.length,511*510);
    for (let y=0;y<510;y++) {
      assert.equal(pixels[y*511],0);
      for (let x=0;x<510;x++)
        assert.equal(pixels[y*511+x+1], qr.getModule(Math.floor(x/6)-4,Math.floor(y/6)-4)?0:255);
    }
  }
});
test("signed URL binds the plan and manifest, expires and exposes no payer details", t => {
  setEnv(t, "TUITION_ADMIN_KEY",key);
  const token=getToken();
  assert.deepEqual(verifyUpnImageToken(token,Date.parse("2026-10-20")),{id:plan.id,fingerprint:fingerprint(plan)});
  assert.equal(verifyUpnImageToken(token,Date.parse("2028-01-01")),null);
  assert.equal(verifyUpnImageToken(token.replace(plan.id,"00000000-0000-4000-8000-000000000000")),null);
  assert.equal(verifyUpnImageToken(token.replace(fingerprint(plan),"0".repeat(64))),null);
  assert.doesNotMatch(upnImageUrl(plan),/Preizkusni|example.invalid|SI560/);
  process.env.TUITION_ADMIN_KEY=key+"rotated";
  assert.equal(verifyUpnImageToken(token),null);
});
test("anonymous sample and invalid capability never read storage", async t => {
  setEnv(t, "TUITION_ADMIN_KEY",key);
  t.mock.method(globalThis,"fetch",async()=>{throw Error("Must not access storage");});
  assert.equal((await request("sample")).status,200);
  assert.equal((await request(plan.id)).status,404);
  assert.equal((await request(getToken().slice(0,-1)+"!")).status,404);
});
test("signed image reads only matching saved offers; payment/cancellation hides it", async t => {
  setEnv(t, "TUITION_ADMIN_KEY",key);
  setEnv(t, "PORTAL_SUPABASE_URL","https://db.example.invalid");
  setEnv(t, "PORTAL_SUPABASE_SERVICE_KEY","synthetic");
  const details=upnDetails(plan);
  const original={id:plan.id,manifest:plan,invitation_channel:"club",bank_reference:details.reference,bank_iban:details.iban,bank_amount_cents:details.amountCents};
  let record: Record<string,unknown>={...original};
  t.mock.method(globalThis,"fetch",async (url: string | URL | Request,init?: RequestInit)=>{
    assert.match(String(url),/^https:\/\/db.example.invalid\/rest\/v1\/tuition_plans\?/);
    assert.equal(init?.method,"GET");
    return Response.json([record]);
  });
  const token=getToken();
  const response=await request(token);
  assert.equal(response.status,200);
  assert.equal(response.headers.get("content-type"),"image/png");
  assert.equal(response.headers.get("cache-control"),"private, no-store");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),tuitionQrPng(plan));
  for (const patch of [{first_payment_id:"pi_paid"},{bank_state:"pending"},{bank_state:"paid"},{cancelled_at:"2026-10-20"},{cancellation_confirmed:true}]) {
    record={...original,...patch};assert.equal((await request(token)).status,410);
  }
  for (const patch of [{bank_amount_cents:1},{invitation_channel:"stripe"},{bank_reference:"RF-invalid"},{manifest:{...plan,participant:"Someone else"}}]) {
    record={...original,...patch};assert.equal((await request(token)).status,404);
  }
});
test("email uses approved copy, escaped personal data and HTTPS PNG instead of CID or SVG", t => {
  setEnv(t, "TUITION_ADMIN_KEY",key);
  const message=combinedInvitation({...plan,participant:'Član <img src=x onerror="alert(1)">'}, "https://example.invalid/pay");
  assert.equal(message.subject,'Vadnina 2026/27 – Član <img src=x onerror="alert(1)">');
  assert.match(message.text,/ŠD Apnea.Si$/);
  assert.match(message.text,/še enkrat hvala za vašo udeležbo/);
  assert.match(message.text,/takoj ob potrditvi plačila/);
  assert.ok(message.text.indexOf("1. Plačilo s kartico")<message.text.indexOf("2. Nakazilo"));
  assert.doesNotMatch(message.html,/<img src=x|src="data:|src="cid:|<svg/);
  assert.match(message.html,/src="https:\/\/www.apnea.si\/api\/tuition\/upn-qr\//);
  assert.match(message.html,/width="204" height="204"/);
});
