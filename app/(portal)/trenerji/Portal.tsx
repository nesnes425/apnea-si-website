"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trainerPortalConfig } from "@/lib/config";
import {
  coachHours,
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
  finalizeSession,
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
                      ? "· zaključeno"
                      : s.status === "cancelled"
                        ? "· odpovedano"
                        : ""}
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
                key={s.id + ":" + s.version}
                session={s}
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
  session: s,
  data,
  user,
  demo,
  reload,
}: {
  session: Session;
  data: Snapshot;
  user: Staff;
  demo: boolean;
  reload: () => Promise<void>;
}) {
  const roster = sessionRoster(data, s);
  const [guests, setGuests] = useState<Member[]>(
    s.entries
      .filter((e) => e.kind === "makeup")
      .map((e) => ({ id: e.member_id, name: e.name, group_id: "" })),
  );
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(s.entries.map((e) => [e.member_id, e.status])),
  );
  const [coachQuery, setCoachQuery] = useState("");
  const [replacementIndex, setReplacementIndex] = useState(0);
  const [comment, setComment] = useState(s.comment),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<Member[]>([]);
  const people = [...roster, ...guests].sort((a, b) => a.name.localeCompare(b.name, "sl", { sensitivity: "base", numeric: true }));
  const locked =
    s.status === "cancelled" ||
    s.date > ljubljanaDate() ||
    (s.status === "closed" && user.role !== "admin");
  return (
    <section className="portal-card">
      <h2>{data.groups.find((g) => g.id === s.group_id)?.label}</h2>
      <p>
        {formatDate(s.date)} · {s.starts.slice(0, 5)}–{s.ends.slice(0, 5)} ·{" "}
        {coachNames(s, data.staff)}
      </p>
      {s.status === "closed" && (
        <p className="portal-notice">
          Evidenca zaključena ·{" "}
          {demo && s.comment
            ? "Testni komentar shranjen, ni poslan"
            : mailLabels[s.mail_status] || s.mail_status}
        </p>
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
                disabled={locked || busy}
                type="button"
                className={`portal-secondary portal-attendance-${value}`}
                aria-label={`${p.name}: ${value === "present" ? "prisoten" : "odsoten"} (${label})`}
                aria-pressed={(statuses[p.id] || "") === value}
                onClick={() => setStatuses({ ...statuses, [p.id]: value })}
              >
                {label}
              </button>
            ))}
            {guests.some((g) => g.id === p.id) && (
              <button
                className="portal-secondary"
                disabled={locked || busy}
                onClick={() => setGuests(guests.filter((g) => g.id !== p.id))}
              >
                Odstrani
              </button>
            )}
          </div>
        </div>
      ))}
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
                    setGuests([...guests, m]);
                    setResults([]);
                    setQuery("");
                  }}
                >
                  Dodaj
                </button>
              </div>
            ))}
        </details>
      )}
      {s.status === "planned" && (
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
                  const result = await assignCoach(s.id,c.id,s.version,replacementIndex === 0 ? "primary" : "additional");
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
          disabled={locked || busy}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <p className="portal-muted">
        Ob zaključku se komentar pošlje na info@apnea.si. Zadeva vsebuje ime
        izvajalca, skupino in datum.
      </p>
      {demo && s.comment && (
        <div className="portal-notice">
          <strong>Predogled, ni poslano</strong>
          <p>{s.mail_subject}</p>
          <p>{s.comment}</p>
        </div>
      )}
      <Button
        className="portal-finalize"
        disabled={locked || busy}
        onClick={async () => {
          if (people.some((p) => !statuses[p.id])) {
            setMessage("Označite vse člane skupine.");
            return;
          }
          setBusy(true);
          try {
            const result = await finalizeSession({
              session_id: s.id,
              version: s.version,
              comment,
              entries: people.map((p) => ({
                member_id: p.id,
                status: statuses[p.id],
                kind: guests.some((g) => g.id === p.id) ? "makeup" : "regular",
              })),
            });
            if (!result.ok) setMessage(result.error);
            else await reload();
          } catch {
            setMessage(
              "Povezava ni uspela. Osvežite stran in preverite, ali je evidenca shranjena.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? "Shranjujem …"
          : s.status === "closed"
            ? "Shrani popravek"
            : "Zaključi evidenco"}
      </Button>
      <p role="status" className="portal-error">
        {message}
      </p>
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
  const [tab, setTab] = useState("attendance"),
    [group, setGroup] = useState(data.groups[0]?.id || ""),
    [month, setMonth] = useState("all"),
    [coach, setCoach] = useState("all"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [onlySubstitutions, setOnlySubstitutions] = useState(false);
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
            if (group === "all") setGroup(data.groups[0]?.id || "");
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
            {data.groups.map((g) => (
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
                      const value =
                        s.status === "cancelled"
                          ? "×"
                          : e
                            ? e.status === "absent"
                              ? "O"
                              : e.kind === "makeup"
                                ? "N"
                                : "P"
                            : s.date > ljubljanaDate() || !enrolledOn(data, m.id, s.group_id, s.date)
                              ? "—"
                              : "?";
                      return (
                        <td key={s.id}>
                          <button
                            className="portal-secondary"
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
                      : "Evidenca še ni zaključena"}{" "}
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
