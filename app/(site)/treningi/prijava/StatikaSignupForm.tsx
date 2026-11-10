"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitStatikaSignup } from "@/lib/training/statika-signup-actions";
import { statikaSignupSchema, type StatikaSignupInput } from "@/lib/training/statika-signup-schema";
import type { StatikaSignupResult } from "@/lib/training/statika-signup";

export function StatikaSignupForm({ groupId, applicationsOpen, isFull, preview }: {
  groupId: string;
  applicationsOpen: boolean;
  isFull: boolean;
  preview: boolean;
}) {
  const requestId = useRef<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Extract<StatikaSignupResult, { ok: true }> | null>(null);

  if (!applicationsOpen) {
    return <div className="border border-gold/30 bg-gold-pale p-5 text-sm leading-relaxed text-navy" role="status">
      Spletne prijave so trenutno zaprte.{" "}
      Pišite nam na <a className="font-medium underline" href="mailto:info@apnea.si">info@apnea.si</a>.
    </div>;
  }

  if (result) {
    return <div className="border border-gold/30 bg-gold-pale p-6 text-navy" role="status">
      <h2 className="mb-3 text-xl font-semibold">
        {result.kind === "confirmed" ? "Vaša prijava na statiko je potrjena." : "Vašo prijavo na statiko smo prejeli."}
      </h2>
      <p className="text-sm leading-relaxed">
        {result.kind === "confirmed"
          ? "Članarino ste v tej sezoni že poravnali, zato je ni treba plačati ponovno. Vaše mesto je rezervirano. Prijava na druge treninge ostane veljavna."
          : "Članarino bomo preverili in vam odgovorili po e-pošti. Mesto do potrditve še ni rezervirano. Ob tej oddaji ne plačate ničesar."}
      </p>
      <p className="mt-3 text-sm leading-relaxed">
        {result.customerEmailSent
          ? "Obvestilo smo poslali tudi na vaš e-poštni naslov."
          : "Kopije obvestila vam trenutno ni bilo mogoče poslati. Vaša prijava je prejeta; ponovna oddaja ni potrebna."}
      </p>
      <p className="mt-3 text-sm leading-relaxed">Vadnina se ureja ločeno. Podrobnosti prejmete po e-pošti.</p>
      {preview && <p className="mt-4 border-t border-gold/30 pt-4 text-sm">To je preizkus lokalnega predogleda. Prava prijava in e-pošta nista bili ustvarjeni.</p>}
    </div>;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setErrors({});
    setServerError(null);
    const data = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    const raw: StatikaSignupInput = {
      groupId,
      requestId: requestId.current,
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      website: String(data.get("website") ?? ""),
      membershipAlreadyPaid: data.get("membershipAlreadyPaid") === "on",
      acceptTerms: data.get("acceptTerms") === "on",
    };
    const parsed = statikaSignupSchema.safeParse(raw);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) fields[String(issue.path[0] ?? "")] ??= issue.message;
      setErrors(fields);
      return;
    }
    setSubmitting(true);
    try {
      const response = await submitStatikaSignup(parsed.data);
      if (response.ok) setResult(response);
      else setServerError(response.error);
    } catch {
      setServerError("Odgovora o prijavi ni bilo mogoče preveriti. Poskusite znova z istimi podatki ali nam pišite na info@apnea.si.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-5" noValidate>
    {isFull && <div className="border border-gold/30 bg-gold-pale p-4 text-sm leading-relaxed text-navy" role="status">
      Skupina je trenutno polna. Če ponavljate oddajo po napaki, lahko z istimi podatki dokončate že rezervirano prijavo.
      Za novo prijavo nam pišite na <a className="font-medium underline" href="mailto:info@apnea.si">info@apnea.si</a>.
    </div>}
    {preview && <div className="border border-gold/30 bg-gold-pale p-4 text-sm leading-relaxed text-navy">
      <strong>Lokalni predogled.</strong> Oddaja ne pošlje e-pošte in ne spremeni evidenc.
      Za potrjeno članarino uporabite <span className="break-all">confirmed@example.invalid</span>, za pregled pa <span className="break-all">pending@example.invalid</span>.
    </div>}
    <Input label="Ime in priimek *" id="fullName" name="fullName" autoComplete="name" required error={errors.fullName} />
    <Input label="E-pošta *" id="email" name="email" type="email" autoComplete="email" required error={errors.email} />
    <p className="-mt-2 text-sm leading-relaxed text-muted-text">Uporabite e-poštni naslov, s katerim ste se prijavili na druge treninge.</p>
    <Input label="Telefon *" id="phone" name="phone" type="tel" autoComplete="tel" required error={errors.phone} />
    <div className="hidden" aria-hidden="true">
      <label htmlFor="website">Spletna stran</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" />
    </div>
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="membershipAlreadyPaid" className="mt-1 h-4 w-4 shrink-0 accent-gold" />
        <span className="text-sm leading-relaxed text-body">Članarino ŠD Apnea Slovenija za tekočo sezono sem že poravnal/-a. *</span>
      </label>
      {errors.membershipAlreadyPaid && <p className="mt-1 text-sm text-red-700" role="alert">{errors.membershipAlreadyPaid}</p>}
    </div>
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="acceptTerms" className="mt-1 h-4 w-4 shrink-0 accent-gold" />
        <span className="text-sm leading-relaxed text-body">Strinjam se s <a href="/pogoji" target="_blank" rel="noopener noreferrer" className="text-gold underline">pogoji poslovanja</a> in <a href="/zasebnost" target="_blank" rel="noopener noreferrer" className="text-gold underline">politiko zasebnosti</a>. *</span>
      </label>
      {errors.acceptTerms && <p className="mt-1 text-sm text-red-700" role="alert">{errors.acceptTerms}</p>}
    </div>
    {serverError && <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{serverError}</p>}
    <Button type="submit" disabled={submitting} fullWidth>{submitting ? "Pošiljam prijavo…" : "Oddajte prijavo brez plačila"}</Button>
    <p className="text-center text-sm leading-relaxed text-muted-text">Ta prijava ne vključuje plačila vadnine. Če članarine ne prepoznamo, jo pred potrditvijo preverimo.</p>
  </form>;
}
