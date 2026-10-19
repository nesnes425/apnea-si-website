import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planSchema} from "./plan";
import {upnDetails} from "./combined-template";
import {iso88592, tuitionQr, upnPayload} from "./upn-qr";
const plan = () => planSchema.parse(JSON.parse(readFileSync("scripts/tuition-plan.example.json","utf8")));
test("UPN fields, full-season cents, RF reference and byte checksum match visible details",()=>{
 const p=plan();p.payer.name="Žiga Ščuk Čopić";
 const details=upnDetails(p),payload=upnPayload(p),f=payload.split("\n");
 assert.equal(f.length,21);assert.equal(f[0],"UPNQR");assert.deepEqual(f.slice(1,5),["","","",""]);
 assert.equal(f[5],p.payer.name);assert.equal(f[6],p.payer.address);assert.equal(f[7],`${p.payer.postalCode} ${p.payer.city}`);
 assert.equal(f[8],"00000058500");assert.equal(f[11],"OTHR");assert.equal(f[12],details.purpose);assert.equal(f[13],"31.10.2026");
 assert.equal(f[14],details.iban);assert.equal(f[15],details.reference);assert.equal(f[16],details.name);assert.equal(f[17],details.address);assert.equal(f[18],details.city);
 assert.equal(Number(f[19]),iso88592(f.slice(0,19).join("\n")+"\n").length);
 assert.ok(iso88592(payload).length<=411);
 assert.deepEqual([...iso88592("ČŠŽčšž")],[200,169,174,232,185,190]);
});
test("fixed version 15, printable vectors and non-payable sample",()=>{
 const live=tuitionQr(plan()),sample=tuitionQr(plan(),true);
 assert.equal(live.version,15);assert.equal(live.size,77);assert.ok(live.path.length>1000);
 assert.ok(live.payload.startsWith("UPNQR\n"));assert.ok(!sample.payload.includes("UPNQR"));
 assert.ok(!sample.payload.includes(upnDetails(plan()).iban));assert.match(sample.payload,/NI ZA PLACILO/);
});
test("unsupported characters, control injection and oversized fields fail without corrupting payer data",()=>{
 for(const name of ["Vzorec 🐬","Vzorec\nČlan"," Vzorec","Vzorec\u0085Član"]){const p=plan();p.payer.name=name;assert.throws(()=>upnPayload(p));}
 const p=plan();p.payer.name="A".repeat(150);p.payer.address="B".repeat(200);assert.throws(()=>upnPayload(p),/411/);
});
