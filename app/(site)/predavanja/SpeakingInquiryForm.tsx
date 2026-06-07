"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitSpeakingInquiry, type SpeakingInquiryState } from "./actions";

const INITIAL: SpeakingInquiryState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Pošiljam…" : "Pošljite povpraševanje →"}
    </Button>
  );
}

export function SpeakingInquiryForm() {
  const [state, formAction] = useActionState(submitSpeakingInquiry, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div className="border border-gold/40 bg-gold/5 p-6">
        <p className="text-[17px] font-semibold text-navy font-heading mb-2">
          Hvala za povpraševanje.
        </p>
        <p className="text-[15px] text-body font-body">
          Odgovorimo vam v kratkem.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="speaking-website">Website</label>
        <input id="speaking-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Input label="Ime in priimek *" id="speaking-name" name="name" type="text" autoComplete="name" required />
        <Input label="E-pošta *" id="speaking-email" name="email" type="email" autoComplete="email" required placeholder="vas@podjetje.si" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Input label="Podjetje / organizacija *" id="speaking-company" name="company" type="text" required placeholder="Naziv podjetja" />
        <Input label="Datum dogodka" id="speaking-date" name="eventDate" type="text" placeholder="Npr. junij 2026" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="speaking-format" className="block text-sm font-medium text-navy font-body mb-2">
            Format
          </label>
          <select
            id="speaking-format"
            name="format"
            className="w-full border border-border-custom bg-white px-4 py-3 text-[15px] font-body text-navy focus:outline-none focus:border-gold transition-colors"
          >
            <option value="">Izberite format</option>
            <option value="Keynote (45-60 min)">Keynote (45-60 min)</option>
            <option value="Delavnica (2-3 ure)">Delavnica (2-3 ure)</option>
            <option value="Nisem se še odločil/a">Nisem se še odločil/a</option>
          </select>
        </div>
        <Input label="Število udeležencev" id="speaking-attendees" name="attendees" type="text" placeholder="Npr. 50" />
      </div>

      <div>
        <label htmlFor="speaking-message" className="block text-sm font-medium text-navy font-body mb-2">
          Sporočilo *
        </label>
        <textarea
          id="speaking-message"
          name="message"
          required
          rows={5}
          maxLength={5000}
          placeholder="Povejte nam več o dogodku, občinstvu in tem, kaj želite, da udeleženci odnesejo s seboj."
          className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors resize-none"
        />
      </div>

      {state.status === "error" && state.message && (
        <p className="text-[14px] text-red-600 font-body" role="alert">
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
