"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestCode, verifyCode, localLogin } from "./actions";
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
    [remember, setRemember] = useState(false);
  return (
    <main className="portal-shell portal-login">
      <div className="portal-card">
        <h1>Prijava za Apnea.Si trenerje</h1>
        <p>Vstop z e-poštnim naslovom, ki mu je omogočen dostop.</p>
        {ready ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const result = sent
                  ? await verifyCode(email, code, remember)
                  : await requestCode(email);
                setMessage(result.error || result.message || "");
                if (!result.error) {
                  if (sent) router.refresh();
                  else setSent(true);
                }
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSent(false);
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
            <Button className="portal-login-submit" type="submit" disabled={busy}>
              {sent ? "Prijava" : "Pošlji prijavno kodo"}
            </Button>
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
