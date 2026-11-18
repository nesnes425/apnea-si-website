import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AttendanceQueue, optimisticSession, type PendingChange } from "./autosave-queue";
import type { Session } from "./model";
import type { SaveResult } from "./autosave";
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const session:Session={id:id(1),group_id:id(2),date:'2026-11-17',starts:'20:00',ends:'21:00',coach_id:id(3),regular_coach_id:id(3),status:'planned',entries:[],comment:'',version:0,mail_status:'none',mail_subject:null};
function storage(){const map=new Map<string,string>();return { get length(){return map.size;},key:(i:number)=>[...map.keys()][i],getItem:(k:string)=>map.get(k)||null,setItem:(k:string,v:string)=>{map.set(k,v);},removeItem:(k:string)=>{map.delete(k);} };}
const item=(value:'present'|'absent'='present',expected:'present'|'absent'|null=null):PendingChange=>({createdAt:Date.now(),change:{type:'attendance',operation_id:randomUUID(),actor_id:id(3),session_id:id(1),member_id:id(4),value,expected},member:{id:id(4),name:'Test',group_id:id(2)}});
const tick=()=>new Promise(r=>setImmediate(r));
test('lost response retains durable operation ID and replays after reload',async()=>{
 const disk=storage();const op=item();let sent='';
 const q=new AttendanceQueue('test:',session,disk,async c=>{sent=c.operation_id;throw Error('offline');});q.restore();q.enqueue(op);await tick();
 assert.equal(disk.length,1);assert.equal(q.state.pending.length,1);assert.equal(q.state.saving,false);
 const restored=new AttendanceQueue('test:',session,disk,async c=>{assert.equal(c.operation_id,sent);return {ok:true,session:{...session,version:1}};});restored.restore();await restored.flush();assert.equal(disk.length,0);assert.equal(restored.state.pending.length,0);
});
test('rapid clicks queue serially and do not acknowledge a newer pending edit',async()=>{
 const disk=storage();let release!:(r:SaveResult)=>void;const calls:string[]=[];
 const q=new AttendanceQueue('test:',session,disk,c=>{calls.push(c.operation_id);return new Promise(r=>{release=r;});});q.restore();q.enqueue(item());q.enqueue(item('absent','present'));
 assert.equal(calls.length,1);assert.equal(optimisticSession(q.state).entries[0].status,'absent');
 release({ok:true,session:{...session,version:1,entries:[{member_id:id(4),name:'Test',kind:'regular',status:'present'}]}});await tick();assert.equal(calls.length,2);assert.equal(q.state.pending.length,1);
 release({ok:true,session:{...session,version:2,entries:[{member_id:id(4),name:'Test',kind:'regular',status:'absent'}]}});await tick();assert.equal(q.state.pending.length,0);assert.equal(disk.length,0);
});
test('a conflict pauses retries until a deliberate resolution',async()=>{
 const disk=storage();let calls=0;const remote={...session,version:2,entries:[{member_id:id(4),name:'Test',kind:'regular' as const,status:'absent' as const}]};
 const q=new AttendanceQueue('test:',session,disk,async()=>{calls++;return {ok:false,conflict:true,error:'conflict',session:remote};});q.restore();q.enqueue(item());await tick();await q.flush();assert.equal(calls,1);assert.equal(q.state.conflict,true);assert.equal(disk.length,1);
 q.resolve(false);assert.equal(q.state.pending.length,0);assert.equal(optimisticSession(q.state).entries[0].status,'absent');
});
test('storage failure never claims durable saving and preserves the in-memory pending input',async()=>{
 const disk=storage();disk.setItem=()=>{throw Error('storage full');};
 const q=new AttendanceQueue('test:',session,disk,async()=>({ok:false,retryable:true,error:'offline'}));q.restore();q.enqueue(item());await tick();assert.equal(q.state.durable,false);assert.equal(q.state.pending.length,1);
});

test('a stalled server action times out without losing the pending operation',async()=>{
 const q=new AttendanceQueue('test:',session,storage(),()=>new Promise(()=>{}),5);q.restore();q.enqueue(item());
 await new Promise(r=>setTimeout(r,15));assert.equal(q.state.saving,false);assert.equal(q.state.pending.length,1);assert.ok(q.state.error);
});
