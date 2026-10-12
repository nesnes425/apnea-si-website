"use client";
import { useEffect, useRef, useState } from "react";
import { draftKey, parseDraft, restoreDraft, type DraftValues } from "@/lib/portal/draft";

// Keeps a draft across in-page navigation if browser storage is unavailable.
// This is client component memory only; writes happen in effects/event handlers.
const memory = new Map<string, string>();
const volatileDrafts = new Set<string>();
function warnBeforeExit(event: BeforeUnloadEvent) {
  if (volatileDrafts.size) { event.preventDefault(); event.returnValue = ""; }
}
function trackVolatile(key: string, failed: boolean) {
  if (failed) volatileDrafts.add(key); else volatileDrafts.delete(key);
  // Keep the warning active even when another session/program unmounts the form.
  if (volatileDrafts.size) window.addEventListener("beforeunload", warnBeforeExit);
  else window.removeEventListener("beforeunload", warnBeforeExit);
}

export function useAttendanceDraft({ userId, sessionId, version, demo, locked, initial, rosterIds }: {
  userId: string; sessionId: string; version: number; demo: boolean; locked: boolean;
  initial: DraftValues; rosterIds: string[];
}) {
  const key = draftKey(userId, sessionId, demo);
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<"loading" | "empty" | "saved" | "error" | "stale">("loading");
  const [previousDraft, setPreviousDraft] = useState<DraftValues | null>(null);
  const valuesRef = useRef(initial);
  const persistent = useRef(true);
  const initialRef = useRef({ initial, rosterIds });
  useEffect(() => {
    persistent.current = !volatileDrafts.has(key);
    let raw: string | null = memory.get(key) || null;
    try { raw ||= localStorage.getItem(key); } catch { persistent.current = false; }
    const draft = parseDraft(raw);
    let nextStatus: typeof status = "empty";
    if (!locked && draft) {
      if (draft.version === version) {
        const restored = restoreDraft(draft, initialRef.current.initial, initialRef.current.rosterIds);
        valuesRef.current = restored;
        // Hydrate browser-only persisted input after SSR, before controls enable.
        setValues(restored);
        nextStatus = persistent.current ? "saved" : "error";
      } else {
        setPreviousDraft(restoreDraft(draft, initialRef.current.initial, initialRef.current.rosterIds));
        nextStatus = "stale";
      }
    }
    setStatus(nextStatus);
    trackVolatile(key, nextStatus === "error");
  }, [key, version, locked]);

  function update(patch: Partial<DraftValues>) {
    const next = { ...valuesRef.current, ...patch };
    valuesRef.current = next;
    setValues(next);
    const raw = JSON.stringify({ ...next, version, savedAt: Date.now() });
    memory.set(key, raw);
    try {
      // Synchronous write before navigation can unmount this form.
      localStorage.setItem(key, raw);
      persistent.current = true;
      trackVolatile(key, false);
      setStatus("saved");
    } catch {
      persistent.current = false;
      trackVolatile(key, true);
      setStatus("error");
    }
  }
  function clear() {
    memory.delete(key);
    try { localStorage.removeItem(key); } catch { /* A stale version is never restored. */ }
    persistent.current = true;
    trackVolatile(key, false);
    setPreviousDraft(null);
    setStatus("empty");
  }
  return { values, update, clear, status, previousDraft };
}
