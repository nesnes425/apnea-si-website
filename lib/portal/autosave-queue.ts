import { changeSchema, type AttendanceChange, type SaveResult } from "./autosave";
import type { Member, Session } from "./model";
export type PendingChange = { change: AttendanceChange; member?: Member; createdAt: number };
export type QueueStorage = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;
export type QueueState = { session: Session; pending: PendingChange[]; saving: boolean; error: string; conflict: boolean; durable: boolean; ready: boolean };

// One durable record per operation: another tab cannot overwrite this tab's journal.
// Operation IDs also serve as server receipts, making ambiguous network retries safe.
export class AttendanceQueue {
  state: QueueState;
  private running = false;
  private stopped = false;
  private listeners = new Set<() => void>();
  constructor(public prefix: string, session: Session, private storage: QueueStorage,
    private send: (change: AttendanceChange) => Promise<SaveResult>, private timeoutMs = 20000) {
    this.state = { session, pending: [], saving: false, error: "", conflict: false, durable: true, ready: false };
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit(patch: Partial<QueueState> = {}) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()); }
  restore() {
    const pending: PendingChange[] = [];
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (!key?.startsWith(this.prefix)) continue;
        try {
          const record = JSON.parse(this.storage.getItem(key)!);
          const change = changeSchema.parse(record.change);
          if (change.session_id === this.state.session.id && key === this.prefix + change.operation_id)
            pending.push({ ...record, change });
        } catch { /* Leave invalid data untouched; never send it. */ }
      }
    } catch { this.state.durable = false; }
    pending.sort((a,b) => a.createdAt - b.createdAt || a.change.operation_id.localeCompare(b.change.operation_id));
    this.emit({ pending, ready: true });
  }
  updateSession(session: Session) {
    if (session.version > this.state.session.version) this.emit({ session: { ...this.state.session, ...session } });
  }
  enqueue(item: PendingChange) {
    try { this.storage.setItem(this.prefix + item.change.operation_id, JSON.stringify(item)); }
    catch { this.state.durable = false; }
    this.emit({ pending: [...this.state.pending, item] });
    void this.flush();
  }
  private remove(item: PendingChange) {
    try { this.storage.removeItem(this.prefix + item.change.operation_id); }
    catch { this.state.durable = false; }
    this.emit({ pending: this.state.pending.filter(p => p.change.operation_id !== item.change.operation_id) });
  }
  resolve(keepMine: boolean) {
    const item = this.state.pending[0];
    if (!item || !this.state.conflict) return;
    // Rejected conflict did not mutate anything. A deliberate retry uses a new ID.
    if (keepMine) {
      const expected = item.change.type === "attendance"
        ? this.state.session.entries.find(e => e.member_id === (item.change as Extract<AttendanceChange, {type: "attendance"}>).member_id)?.status ?? null
        : this.state.session.comment;
      const sameField = this.state.pending.filter(p => p.change.type === item.change.type &&
        (p.change.type === "comment" || (item.change.type === "attendance" && p.change.member_id === item.change.member_id)));
      const latest = sameField.at(-1)!;
      const change = { ...latest.change, operation_id: crypto.randomUUID(), expected } as AttendanceChange;
      for (const p of sameField) this.remove(p);
      this.stopped = false;
      this.emit({ conflict: false, error: "" });
      this.enqueue({ ...latest, change, createdAt: Date.now() });
    } else {
      // Discard queued edits of the same field, which were based on the rejected value.
      for (const p of [...this.state.pending]) if (p.change.type === item.change.type &&
        (p.change.type === "comment" || (item.change.type === "attendance" && p.change.member_id === (item.change as Extract<AttendanceChange, {type: "attendance"}>).member_id))) this.remove(p);
      this.stopped = false;
      this.emit({ conflict: false, error: "" });
      void this.flush();
    }
  }
  retry() { if (!this.state.conflict) this.stopped = false; return this.flush(); }
  async flush() {
    if (this.running || this.stopped || !this.state.pending.length) return;
    this.running = true;
    this.emit({ saving: true, error: "" });
    try {
      while (this.state.pending.length) {
        const item = this.state.pending[0];
        let result: SaveResult;
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          result = await Promise.race([this.send(item.change), new Promise<SaveResult>((_, reject) => {
            timer = setTimeout(() => reject(new Error("timeout")), this.timeoutMs);
          })]);
        }
        catch { result = { ok: false, retryable: true, error: "Povezava ni uspela. Vnos čaka na ponovno pošiljanje." }; }
        finally { clearTimeout(timer); }
        if (result.session) this.updateSession(result.session);
        if (!result.ok) {
          this.stopped = !result.retryable;
          this.emit({ error: result.error, conflict: !!result.conflict });
          break;
        }
        this.remove(item);
      }
    } finally { this.running = false; this.emit({ saving: false }); }
  }
}

export function optimisticSession(state: QueueState): Session {
  const s = { ...state.session, entries: [...state.session.entries] };
  for (const {change,member} of state.pending) {
    if (change.type !== "attendance") continue;
    const old = s.entries.find(e => e.member_id === change.member_id);
    s.entries = s.entries.filter(e => e.member_id !== change.member_id);
    if (change.value !== "remove") s.entries.push({ member_id: change.member_id, name: old?.name || member?.name || "Član",
      kind: old?.kind || (member?.group_id === s.group_id ? "regular" : "makeup"), status: change.value });
  }
  return s;
}
