"use client";
import { useEffect, useRef, useState } from "react";
import { AttendanceQueue, optimisticSession, type QueueState } from "@/lib/portal/autosave-queue";
import { type Member, type Session } from "@/lib/portal/model";
import { saveChange } from "./actions";

// Queues survive in-page navigation and retain the actor ID across login changes.
const queues = new Map<string, AttendanceQueue>();
const storage = {
  get length() { return window.localStorage.length; },
  key(i: number) { return window.localStorage.key(i); },
  getItem(k: string) { return window.localStorage.getItem(k); },
  setItem(k: string, v: string) { window.localStorage.setItem(k,v); },
  removeItem(k: string) { window.localStorage.removeItem(k); },
};
let watching = false;
function watchQueues() {
  if (watching) return;
  watching = true;
  const retry = () => { for (const q of queues.values()) void q.flush(); };
  window.addEventListener("online", retry);
  window.addEventListener("focus", retry);
  window.setInterval(retry, 5000);
  window.addEventListener("beforeunload", e => {
    if ([...queues.values()].some(q => q.state.pending.length)) { e.preventDefault(); e.returnValue = ""; }
  });
}
export function useAttendanceAutosave(session: Session, actorId: string, demo: boolean, onSaved: (s: Session) => void) {
  const prefix = `apnea-autosave:${demo ? "demo" : "live"}:${actorId}:${session.id}:`;
  const queueRef = useRef<AttendanceQueue | null>(null);
  const callback = useRef(onSaved);
  useEffect(() => { callback.current = onSaved; }, [onSaved]);
  const [state, setState] = useState<QueueState>({ session, pending: [], saving: false, error: "", conflict: false, durable: true, ready: false });
  useEffect(() => {
    let queue = queues.get(prefix);
    if (!queue) {
      queue = new AttendanceQueue(prefix, session, storage, async change => {
        if (!navigator.onLine) return { ok: false, retryable: true, error: "Čaka na povezavo. Vnos še ni shranjen v bazo." };
        return saveChange(change);
      });
      queues.set(prefix, queue);
      queue.restore();
    }
    queueRef.current = queue;
    const q = queue;
    const update = () => { setState(q.state); callback.current(q.state.session); };
    const unsubscribe = q.subscribe(update);
    update();
    watchQueues();
    void q.retry();
    return unsubscribe;
    // A session form is keyed by identity/session, not by every saved version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix]);
  useEffect(() => { queueRef.current?.updateSession(session); }, [session]);
  const visible = optimisticSession(state);
  function mark(member: Member, value: "present" | "absent" | "remove") {
    const queue = queueRef.current;
    if (!queue || !state.ready) return;
    const current = optimisticSession(queue.state).entries.find(e => e.member_id === member.id);
    if (current?.status === value) return;
    queue.enqueue({ change: { type: "attendance", operation_id: crypto.randomUUID(), actor_id: actorId,
      session_id: session.id, member_id: member.id, value, expected: current?.status ?? null }, member, createdAt: Date.now() });
  }
  function sendComment(value: string) {
    const queue = queueRef.current;
    if (!queue) return;
    queue.enqueue({ change: { type: "comment", operation_id: crypto.randomUUID(), actor_id: actorId,
      session_id: session.id, value: value.trim(), expected: queue.state.session.comment }, createdAt: Date.now() });
  }
  return { ...state, visible, mark, sendComment, resolve: (mine: boolean) => queueRef.current?.resolve(mine), retry: () => queueRef.current?.retry() };
}
