"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trainerPortalConfig } from "@/lib/config";
import { useAttendanceAutosave } from "./useAttendanceAutosave";
import { draftKey, parseDraft, type AttendanceDraft } from "@/lib/portal/draft";
import {
  coachHours,
  canEditAttendance,
  attendanceEditDeadline,
  orderedSessions,
  selectedSession,
  sessionCoaches,
  regularCoaches,
  coachNames,
  enrolledOn,
  sessionRoster,
  ljubljanaDate,
  type Snapshot,
  type Staff,
  type Session,
  type Member,
} from "@/lib/portal/model";
import {
  assignCoach,
  findMakeup,
  loadPortal,
  logout,
} from "./actions";
type Initial = { data: Snapshot; user: Staff; demo: boolean };
type Level = keyof typeof trainerPortalConfig.levels;
// Katarina manages the portal but does not cover training sessions.
function canBeReplacementCoach(coach: Staff) {
  return coach.active && coach.id !== "1f8e258d-925e-4d73-9122-4993d2a29e3b";
}
function groupLevel(value?: string): Level {
  const normalized = value?.trim().toLocaleLowerCase("sl");
  if (normalized === "beginner" || normalized === "začetni") return "beginner";
  if (normalized === "performance") return "performance";
  return "advanced";
}
const formatDate = (d: string) => d.split("-").reverse().join(". ");
const weekdays = ["ponedeljek", "torek", "sreda", "četrtek", "petek", "sobota", "nedelja"];
function weeklyGroupTime(label: string) {
  // Group labels carry the recurring slot, including legacy hours such as 21–22.
  const slot = label.toLocaleLowerCase("sl").match(
    /(?:^|·)\s*(ponedeljek|torek|sreda|četrtek|petek|sobota|nedelja)\s+(\d{1,2})(?::(\d{2}))?/,
  );
  return slot
    ? weekdays.indexOf(slot[1]) * 24 * 60 + Number(slot[2]) * 60 + Number(slot[3] || 0)
    : Number.MAX_SAFE_INTEGER;
}
const mailLabels: Record<string, string> = {
  none: "Brez komentarja",
  pending: "Komentar čaka na pošiljanje",
  sent: "Brevo je sprejel sporočilo",
  failed: "Pošiljanje ni uspelo — preveri vodstvo",
  uncertain: "Dostava ni potrjena — preveri vodstvo",
};
export default function Portal({
  initial,
  adminView = false,
}: {
  initial: Initial;
  adminView?: boolean;
}) {
  const [state, setState] = useState(initial);
  const { data, user, demo } = state;
  const sessions = orderedSessions(data.sessions);
  const [sessionId, setSessionId] = useState(sessions[0]?.id || ""),
    [tab, setTab] = useState("attendance"),
    [level, setLevel] =
      useState<Level>(() => groupLevel(data.groups.find(g => g.id === sessions[0]?.group_id)?.level));
  const s = data.sessions.find((s) => s.id === sessionId);
  async function reload() {
    const next = await loadPortal();
    const selected = selectedSession(next.data.sessions, sessionId);
    if (selected?.id !== sessionId) {
      setSessionId(selected?.id || "");
      setLevel(groupLevel(next.data.groups.find(g => g.id === selected?.group_id)?.level));
    }
    setState(next);
  }
  return (
    <>
      <header className="portal-header">
        <Link href="/trenerji" className="portal-brand">
          APNEA.SI
        </Link>
        <div className="portal-controls">
          <span>{user.name}</span>
          {user.role === "admin" && (
            <Link href={adminView ? "/trenerji" : "/trenerji/pregled"}>
              {adminView ? "Treningi" : "Pregled sezone"}
            </Link>
          )}
          <form action={logout}>
            <button className="portal-secondary">Odjava</button>
          </form>
        </div>
      </header>
      <main className="portal-shell">
        {demo && (
          <p className="portal-notice">
            Lokalni pilot · izmišljeni člani · testni termini · e-pošta se ne
            pošilja.
          </p>
        )}
        {adminView ? (
          <Dashboard data={data} reload={reload} />
        ) : (
          <>
            <h1>{user.welcome || "Dobrodošli"} {user.name.split(" ")[0]}, hvala za tvoj trud!</h1>
            <label>
              Termin in datum
              <select
                value={sessionId}
                onChange={(e) => {
                  setSessionId(e.target.value);
                  const selected = data.sessions.find(s => s.id === e.target.value);
                  setLevel(groupLevel(data.groups.find(g => g.id === selected?.group_id)?.level));
                }}
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.date)} ·{" "}
                    {data.groups.find((g) => g.id === s.group_id)?.label}{" "}
                    {s.status === "closed"
                      ? "· shranjeno"
                      : s.status === "cancelled"
                        ? "· odpovedano"
                        : s.first_saved_at ? "· delno izpolnjeno" : ""}
                  </option>
                ))}
              </select>
            </label>
            <nav className="portal-controls" aria-label="Trening">
              <button
                className="portal-secondary"
                aria-pressed={tab === "attendance"}
                onClick={() => setTab("attendance")}
              >
                Prisotnost
              </button>
              <button
                className="portal-secondary"
                aria-pressed={tab === "program"}
                onClick={() => setTab("program")}
              >
                Program tedna
              </button>
            </nav>
            {tab === "program" ? (
              <section className="portal-card">
                <h2>Program tekočega tedna</h2>
                <label>
                  Nivo programa
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as typeof level)}
                  >
                    {Object.entries(trainerPortalConfig.levels).map(
                      ([id, name]) => (
                        <option value={id} key={id}>
                          {name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                {data.programs
                  .filter((p) => p.level === level)
                  .map((p) => (
                    <article key={p.id}>
                      <p className="portal-muted">
                        {formatDate(p.valid_from)}–{formatDate(p.valid_until)}
                      </p>
                      <div className="portal-program">{p.content}</div>
                    </article>
                  ))}
                {!data.programs.some((p) => p.level === level) && (
                  <p className="portal-notice">
                    Program za ta nivo še ni objavljen.
                  </p>
                )}
                <p className="portal-muted">
                  Prikazujemo samo trenutno veljavne programe, tudi ko
                  pregledujete starejši termin.
                </p>
              </section>
            ) : s ? (
              <SessionForm
                key={user.id + ":" + s.id}
                session={s}
                onSaved={saved => setState(previous => {
                  const current = previous.data.sessions.find(item => item.id === saved.id);
                  if (current && current.version >= saved.version) return previous;
                  return { ...previous, data: { ...previous.data, sessions: previous.data.sessions.map(item => item.id === saved.id ? { ...item, ...saved } : item) } };
                })}
                data={data}
                user={user}
                demo={demo}
                reload={reload}
              />
            ) : (
              <p className="portal-card">
                Trenutno nimate dodeljenih treningov.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}
function SessionForm({
  session: source,
  onSaved,
  data,
  user,
  demo,
  reload,
}: {
  session: Session;
  onSaved: (s: Session) => void;
  data: Snapshot;
  user: Staff;
  demo: boolean;
  reload: () => Promise<void>;
}) {
  const autosave = useAttendanceAutosave(source, user.id, demo, onSaved);
  const s = autosave.session;
  const roster = sessionRoster(data, s);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const locked = !canEditAttendance(s, user, ljubljanaDate(now), now);
  const editDeadline = attendanceEditDeadline(s);
  const guests = autosave.visible.entries.filter(e => e.kind === "makeup").map(e => ({ id: e.member_id, name: e.name, group_id: "" }));
  const statuses = Object.fromEntries(autosave.visible.entries.map(e => [e.member_id,e.status]));
  const commentKey = `apnea-comment:${demo ? "demo" : "live"}:${user.id}:${s.id}`;
  const [comment, updateComment] = useState(source.comment);
  const [commentStored, setCommentStored] = useState(true);
  const [legacy, setLegacy] = useState<AttendanceDraft | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(commentKey);
      // Browser-only hydration of a durable comment draft after SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) updateComment(stored);
      setLegacy(parseDraft(localStorage.getItem(draftKey(user.id, source.id, demo))));
    } catch { setCommentStored(false); }
  }, [commentKey, user.id, source.id, demo]);
  function setComment(value: string) {
    updateComment(value);
    try { localStorage.setItem(commentKey,value); setCommentStored(true); }
    catch { setCommentStored(false); }
  }
  const [coachQuery, setCoachQuery] = useState("");
  const [replacementIndex, setReplacementIndex] = useState(0);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Member[]>([]);
  const people = [...roster, ...guests].sort((a, b) => a.name.localeCompare(b.name, "sl", { sensitivity: "base", numeric: true }));
  const editingDisabled = locked || !autosave.ready || autosave.conflict;
  return (
    <section className="portal-card">
      <h2>{data.groups.find((g) => g.id === s.group_id)?.label}</h2>
      <p>
        {formatDate(s.date)} · {s.starts.slice(0, 5)}–{s.ends.slice(0, 5)} ·{" "}
        {coachNames(s, data.staff)}
      </p>
      {s.status === "closed" && (
        <p className="portal-notice">
          Prisotnost shranjena ·{" "}
          {demo && s.comment
            ? "Testni komentar shranjen, ni poslan"
            : mailLabels[s.mail_status] || s.mail_status}
        </p>
      )}
      {(s.first_saved_at || s.status === "closed") && user.role !== "admin" && (
        <p className="portal-muted">{locked
          ? "Rok za popravljanje je potekel. Za popravek se obrnite na vodstvo."
          : `Prisotnost lahko popravljate do ${new Intl.DateTimeFormat("sl-SI", { timeZone: "Europe/Ljubljana", dateStyle: "medium", timeStyle: "short" }).format(new Date(editDeadline!))}. Rok velja 7 dni od prvega shranjevanja.`}</p>
      )}
      {s.date > ljubljanaDate() && (
        <p className="portal-notice">
          Prisotnost boste lahko vnesli na dan treninga.
        </p>
      )}
      <p className="portal-muted">
        {people.filter((p) => statuses[p.id] === "present").length} prisotnih ·{" "}
        {people.filter((p) => !statuses[p.id]).length} neoznačenih
      </p>
      <p role="status" aria-live="polite" className={autosave.error || !autosave.durable ? "portal-notice" : "portal-muted"}>
        {!autosave.ready ? "Preverjam shranjene vnose …" :
          autosave.error || (autosave.saving ? "Shranjujem …" : autosave.pending.length ? "Vnosi čakajo na shranjevanje." : s.first_saved_at ? "Shranjeno. Spremembe se shranjujejo samodejno." : "Vsak klik na Da ali Ne se samodejno shrani.")}
        {!autosave.durable && " Shranjevanje na napravo ni na voljo. Ne zaprite strani, dokler vnosi niso shranjeni v bazo."}
      </p>
      {s.first_saved_at && s.status !== "closed" && <p className="portal-notice">Evidenca je delno izpolnjena. Ure trenerjev bodo upoštevane, ko označite vse člane.</p>}
      {autosave.error && !autosave.conflict && <button className="portal-secondary" onClick={() => void autosave.retry()}>Poskusi ponovno</button>}
      {autosave.conflict && <div className="portal-notice">
        <p>{autosave.pending[0]?.member?.name || "Komentar"}: trenutno shranjeno — {autosave.pending[0]?.change.type === "attendance"
          ? (s.entries.find(e => e.member_id === autosave.pending[0]?.member?.id)?.status === "present" ? "Da" : s.entries.find(e => e.member_id === autosave.pending[0]?.member?.id)?.status === "absent" ? "Ne" : "neoznačeno")
          : s.comment}</p>
        <button className="portal-secondary" onClick={() => autosave.resolve(false)}>Obdrži shranjeni vnos</button>{" "}
        <button className="portal-secondary" onClick={() => autosave.resolve(true)}>Uporabi moj vnos</button>
      </div>}
      {legacy && <details className="portal-makeup"><summary>Prejšnji neshranjeni osnutek</summary>
        <p>Osnutek iz prejšnje različice ni samodejno prepisal shranjene evidence. Preglejte vrednosti in jih po potrebi ponovno označite.</p>
        {Object.entries(legacy.statuses).map(([id,value]) => <p key={id}>{[...roster,...legacy.guests].find(m => m.id === id)?.name || "Član"}: {value === "present" ? "Da" : "Ne"}</p>)}
        <p>{legacy.comment}</p>
      </details>}
      {people.map((p) => (
        <div className="portal-row" key={p.id}>
          <div>
            {p.name}
            {guests.some((g) => g.id === p.id) && (
              <span className="portal-muted"> · nadomeščanje</span>
            )}
          </div>
          <div className="portal-controls portal-attendance-buttons">
            {[
              ["present", "Da"],
              ["absent", "Ne"],
            ].map(([value, label]) => (
              <button
                key={value}
                disabled={editingDisabled}
                type="button"
                className={`portal-secondary portal-attendance-${value}`}
                aria-label={`${p.name}: ${value === "present" ? "prisoten" : "odsoten"} (${label})`}
                aria-pressed={(statuses[p.id] || "") === value}
                onClick={() => autosave.mark(p, value as "present" | "absent")}
              >
                {label}
              </button>
            ))}
            {guests.some((g) => g.id === p.id) && (
              <button
                className="portal-secondary"
                disabled={editingDisabled}
                onClick={() => autosave.mark(p, "remove")}
              >
                Odstrani
              </button>
            )}
          </div>
        </div>
      ))}
      <p role="status" className="portal-error">
        {message}
      </p>
      {!locked && (
        <details className="portal-makeup">
          <summary>Dodaj člana na nadomeščanje</summary>
          <label>
            Ime člana (najmanj 3 znaki)
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResults([]);
              }}
            />
          </label>
          <button
            className="portal-secondary"
            disabled={busy || query.trim().length < 3}
            onClick={async () => {
              setBusy(true);
              try {
                const matches = await findMakeup(query, s.id);
                setResults(matches);
                setMessage(matches.length ? "" : "Ni zadetkov za iskano ime.");
              } catch {
                setMessage("Iskanje ni uspelo.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Poišči člana
          </button>
          {results
            .filter((m) => !people.some((p) => p.id === m.id))
            .map((m) => (
              <div className="portal-row" key={m.id}>
                <span>{m.name}</span>
                <button
                  className="portal-secondary"
                  onClick={() => {
                    autosave.mark(m, "present");
                    setResults([]);
                    setQuery("");
                  }}
                >
                  Dodaj kot prisotnega
                </button>
              </div>
            ))}
        </details>
      )}
      {s.status === "planned" && !autosave.pending.length && (
        <details className="portal-makeup">
          <summary>Določi nadomestnega trenerja</summary>
          <p className="portal-muted">Izbira velja samo za ta datum. Nadomestni trener dobi dostop do članov in evidence tega treninga.</p>
          {sessionCoaches(s).length > 1 && <label>Trener, ki ga nadomešča
            <select value={replacementIndex} onChange={e => setReplacementIndex(Number(e.target.value))}>
              {sessionCoaches(s).map((id,index) => <option key={id} value={index}>{data.staff.find(c => c.id === id)?.name}</option>)}
            </select>
          </label>}
          <label>Ime nadomestnega trenerja
            <input value={coachQuery} onChange={e => setCoachQuery(e.target.value)} placeholder="Poišči trenerja" />
          </label>
          {data.staff.filter(c => canBeReplacementCoach(c) && !sessionCoaches(s).includes(c.id) && c.name.toLocaleLowerCase("sl").includes(coachQuery.trim().toLocaleLowerCase("sl"))).sort((a,b) => a.name.localeCompare(b.name,"sl")).map(c => (
            <div className="portal-row" key={c.id}>
              <span>{c.name}</span>
              <button className="portal-secondary" disabled={busy} onClick={async () => {
                setBusy(true);
                try {
                  const result = await assignCoach(s.id,c.id,s.version,replacementIndex === 0 ? "primary" : "additional", sessionCoaches(s)[replacementIndex]);
                  if (!result.ok) setMessage(result.error);
                  else { setMessage("Nadomestni trener je določen."); setCoachQuery(""); await reload(); }
                } catch { setMessage("Dodelitev ni uspela. Poskusite ponovno."); }
                finally { setBusy(false); }
              }}>Določi</button>
            </div>
          ))}
        </details>
      )}
      <label>
        Komentar trenerja (neobvezno)
        <textarea
          rows={4}
          maxLength={4000}
          value={comment}
          disabled={editingDisabled}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <p className="portal-muted">
        Z gumbom Pošlji komentar se komentar pošlje na info@apnea.si. Zadeva vsebuje ime
        izvajalca, skupino in datum.
      </p>
      {!commentStored && <p className="portal-error">Osnutka komentarja ni mogoče shraniti na napravo.</p>}
      <Button className="portal-finalize" disabled={editingDisabled || !comment.trim() || !!autosave.pending.length || comment.trim() === s.comment}
        onClick={() => autosave.sendComment(comment)}>Pošlji komentar</Button>
      {s.comment && <p role="status" className="portal-muted">{demo ? "Testni komentar shranjen, ni poslan" : mailLabels[s.mail_status]}</p>}
      {demo && s.comment && (
        <div className="portal-notice">
          <strong>Predogled, ni poslano</strong>
          <p>{s.mail_subject}</p>
          <p>{s.comment}</p>
        </div>
      )}
    </section>
  );
}
function Dashboard({
  data,
  reload,
}: {
  data: Snapshot;
  reload: () => Promise<void>;
}) {
  const groups = [...data.groups].sort((a, b) =>
    weeklyGroupTime(a.label) - weeklyGroupTime(b.label) ||
    a.label.localeCompare(b.label, "sl") || a.id.localeCompare(b.id),
  );
  const [tab, setTab] = useState("attendance"),
    [group, setGroup] = useState(groups[0]?.id || ""),
    [month, setMonth] = useState("all"),
    [coach, setCoach] = useState("all"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [onlySubstitutions, setOnlySubstitutions] = useState(false);
  const now = new Date();
  const today = ljubljanaDate(now);
  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Ljubljana", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
  const months = [
    ...new Set(data.sessions.map((s) => s.date.slice(0, 7))),
  ].sort();
  const sessions = data.sessions
    .filter(
      (s) =>
        (group === "all" || s.group_id === group) &&
        (month === "all" || s.date.startsWith(month)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const members = data.members.filter((m) => data.memberships ? data.memberships.some(e => e.member_id === m.id && e.group_id === group) || sessions.some(s => s.entries.some(e => e.member_id === m.id && e.kind === "regular")) : m.group_id === group);
  const guestMap = new Map(
    sessions.flatMap((s) =>
      s.entries
        .filter((e) => !members.some(m => m.id === e.member_id))
        .map(
          (e) =>
            [
              e.member_id,
              { id: e.member_id, name: e.name, group_id: "guest" },
            ] as const,
        ),
    ),
  );
  const rows = [...members, ...guestMap.values()].sort((a,b) => a.name.localeCompare(b.name,"sl"));
  return (
    <>
      <h1>Pregled sezone</h1>
      <p className="portal-muted">
        Zasebni pregled vodstva · prisotnost in ure trenerjev
      </p>
      <nav className="portal-controls">
        <button
          className="portal-secondary"
          aria-pressed={tab === "attendance"}
          onClick={() => {
            setTab("attendance");
            if (group === "all") setGroup(groups[0]?.id || "");
          }}
        >
          Prisotnost članov
        </button>
        <button
          className="portal-secondary"
          aria-pressed={tab === "coaches"}
          onClick={() => setTab("coaches")}
        >
          Ure trenerjev
        </button>
      </nav>
      <div className="portal-columns">
        <label>
          Termin
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {tab === "coaches" && <option value="all">Vsi termini</option>}
            {groups.map((g) => (
              <option value={g.id} key={g.id}>
                {g.label} · {g.season}
              </option>
            ))}
          </select>
        </label>
        <label>
          Obdobje
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">Celotna sezona</option>
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {tab === "attendance" ? (
        <section className="portal-card">
          <p className="portal-muted">
            P prisoten · O odsoten · N prisoten na nadomeščanju · ? ni vneseno ·
            — ni vpisan / prihodnji termin · × odpovedano
          </p>
          <div className="portal-scroll">
            <table className="portal-matrix">
              <thead>
                <tr>
                  <th>Član</th>
                  {sessions.map((s) => (
                    <th key={s.id}>{formatDate(s.date)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">
                      {m.name}
                      {m.group_id === "guest" ? " (nadomeščanje)" : ""}
                    </th>
                    {sessions.map((s) => {
                      const e = s.entries.find((e) => e.member_id === m.id);
                      const hasEnded = s.date < today || (s.date === today && s.ends.slice(0, 5) <= localTime);
                      const value =
                        s.status === "cancelled"
                          ? "×"
                          : e
                            ? e.status === "absent"
                              ? "O"
                              : e.kind === "makeup"
                                ? "N"
                                : "P"
                            : s.date > today || !enrolledOn(data, m.id, s.group_id, s.date)
                              ? "—"
                              : "?";
                      return (
                        <td key={s.id}>
                          <button
                            className={`portal-secondary${hasEnded && value === "P" ? " portal-matrix-present" : hasEnded && value === "O" ? " portal-matrix-absent" : ""}`}
                            aria-label={`${m.name}, ${formatDate(s.date)}, ${value}`}
                            onClick={() =>
                              setMessage(
                                `${m.name} · ${formatDate(s.date)} · ${value}\nIzvajalec: ${coachNames(s, data.staff) || "—"}`,
                              )
                            }
                          >
                            {value}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p>V tej skupini še ni članov.</p>}
        </section>
      ) : (
        <section className="portal-card">
          <label>
            Trener
            <select value={coach} onChange={(e) => setCoach(e.target.value)}>
              <option value="all">Vsi trenerji</option>
              {data.staff.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="portal-scroll">
            <table>
              <thead>
                <tr>
                  <th>Trener</th>
                  <th>Redne ure</th>
                  <th>Nadomeščene ure</th>
                  <th>Skupaj</th>
                </tr>
              </thead>
              <tbody>
                {data.staff
                  .filter((c) => coach === "all" || c.id === coach)
                  .map((c) => {
                    const h = coachHours(sessions, c.id);
                    return (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{h.regular} h</td>
                        <td>{h.makeup} h</td>
                        <td>{h.regular + h.makeup} h</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p className="portal-muted">
            Vključene so samo zaključene izvedbe. Ure določa urnik termina. Spodaj so navedeni konkretni datumi in skupine nadomeščanj.
          </p>
        </section>
      )}
      <p role="status" className="portal-notice" hidden={!message}>
        {message}
      </p>
      <section className="portal-card">
        <h2>Izvedbe in nadomeščanja trenerjev</h2>
        <label className="portal-remember"><input type="checkbox" checked={onlySubstitutions} onChange={e => setOnlySubstitutions(e.target.checked)} />Samo opravljena nadomeščanja</label>
        {sessions
          .filter(
            (s) => (tab !== "coaches" || coach === "all" || sessionCoaches(s).includes(coach)) && (!onlySubstitutions || (s.status === "closed" && sessionCoaches(s).some(id => !regularCoaches(s).includes(id) && (coach === "all" || tab !== "coaches" || coach === id)))),
          )
          .map((s) => (
            <div key={s.id} className="portal-row">
              <div>
                <strong>
                  {formatDate(s.date)} ·{" "}
                  {data.groups.find((g) => g.id === s.group_id)?.label}
                </strong>
                <p className="portal-muted">
                  {s.status === "closed"
                    ? "Zaključeno"
                    : s.status === "cancelled"
                      ? "Odpovedano"
                      : s.first_saved_at ? "Delno izpolnjena evidenca" : "Evidenca še ni izpolnjena"}{" "}
                  ·{" "}
                  {sessionCoaches(s).every(id => regularCoaches(s).includes(id))
                    ? "Redna ura"
                    : "Nadomeščanje"}
                </p>
                <p className="portal-muted">{sessionCoaches(s).map((id,index) => {
                  const actual = data.staff.find(c => c.id === id)?.name || "—";
                  const original = data.staff.find(c => c.id === regularCoaches(s)[index])?.name || "—";
                  return id === regularCoaches(s)[index] ? actual : `${actual} nadomešča ${original}`;
                }).join(" · ")}</p>
                {s.comment && (
                  <>
                    <p>{s.comment}</p>
                    <p className="portal-muted">
                      {mailLabels[s.mail_status] || s.mail_status}
                    </p>
                  </>
                )}
              </div>
              {sessionCoaches(s).map((assignedId, index) => <label key={index}>
                Izvajalec {index + 1}
                <select
                  aria-label={`Izvajalec ${index + 1}, ${s.date}`}
                  disabled={s.status !== "planned" || busy}
                  value={assignedId}
                  onChange={async (e) => {
                    setBusy(true);
                    try {
                      const result = await assignCoach(
                        s.id,
                        e.target.value,
                        s.version,
                        index === 0 ? "primary" : "additional",
                        assignedId,
                      );
                      if (!result.ok) setMessage(result.error);
                      else {
                        setMessage("Izvajalec je posodobljen.");
                        await reload();
                      }
                    } catch {
                      setMessage("Dodelitev ni uspela.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {data.staff.filter(canBeReplacementCoach).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>)}
            </div>
          ))}
      </section>
    </>
  );
}
