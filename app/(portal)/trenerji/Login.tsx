"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestCode, verifyCode, localLogin, resumeLogin } from "./actions";
export default function Login({
  demo,
  ready,
}: {
  demo: boolean;
  ready: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [checkingSession, setCheckingSession] = useState(true),
    [resendAt, setResendAt] = useState(0),
    [secondsLeft, setSecondsLeft] = useState(0),
    [remember, setRemember] = useState(false);
  useEffect(() => {
    if (!resendAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);
  async function sendCode() {
    if (busy || Date.now() < resendAt) return;
    setBusy(true);
    try {
      const result = await requestCode(email);
      if ("authenticated" in result) {
        router.refresh();
        return;
      }
      setMessage(result.error || result.message || "");
      if (result.retryAfter) {
        setSecondsLeft(result.retryAfter);
        setResendAt(Date.now() + result.retryAfter * 1000);
      }
      if (!result.error) {
        setSent(true);
        setCode("");
      }
    } catch {
      setMessage("Povezava ni uspela. Poskusite ponovno.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    // A top-level navigation can omit legacy Strict cookies, and mobile browsers
    // can restore a stale login page. A same-origin request sees the saved session.
    async function resume() {
      try {
        const authenticated = await resumeLogin();
        if (active && authenticated) router.refresh();
      } catch {
        if (active) setMessage("Povezava ni uspela. Poskusite ponovno.");
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    if (ready) void resume();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted && ready) void resume();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      active = false;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [ready, router]);
  return (
    <main className="portal-shell portal-login">
      <div className="portal-card">
        <h1>Prijava za Apnea.Si trenerje</h1>
        <p>Vstop z e-poštnim naslovom, ki mu je omogočen dostop.</p>
        {ready ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!sent) {
                await sendCode();
                return;
              }
              setBusy(true);
              try {
                const result = await verifyCode(email, code, remember);
                setMessage(result.error || result.message || "");
                if (!result.error) router.refresh();
              } catch {
                setMessage("Povezava ni uspela. Poskusite ponovno.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              E-pošta
              <input
                type="email"
                autoComplete="email"
                required
                disabled={busy}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
                  setCode("");
                  setMessage("");
                }}
              />
            </label>
            {sent && (
              <label>
                Prijavna koda
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,8}"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
            )}
            <label className="portal-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span>Zapomni si me na tej napravi</span>
            </label>
            <Button className="portal-login-submit" type="submit" disabled={busy || checkingSession || (!sent && secondsLeft > 0)}>
              {checkingSession ? "Preverjam prijavo …" : sent ? "Prijava" : "Pošlji prijavno kodo"}
            </Button>
            {sent && <button className="portal-secondary portal-resend" type="button"
              disabled={busy || checkingSession || secondsLeft > 0} onClick={sendCode}>
              {secondsLeft > 0 ? `Pošlji novo kodo čez ${secondsLeft} s` : "Pošlji novo kodo"}
            </button>}
            {!sent && secondsLeft > 0 && <p>Naslednjo kodo lahko zahtevate čez {secondsLeft} s.</p>}
            <p role="status">{message}</p>
          </form>
        ) : (
          <p className="portal-notice">
            Pilot še ni povezan z zasebno bazo. Dostop bo omogočen po
            nastavitvi.
          </p>
        )}
        {demo && (
          <div className="portal-notice">
            <p>Lokalni preizkus z izmišljenimi člani. E-pošte ne pošilja.</p>
            <form action={localLogin} className="portal-controls">
              <button className="portal-secondary" name="role" value="trainer">
                Testna trenerka
              </button>
              <button className="portal-secondary" name="role" value="admin">
                Testno vodstvo
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
