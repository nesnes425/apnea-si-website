"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { submitContactForm, type ContactFormState } from "./actions";

const INITIAL: ContactFormState = { status: "idle" };

function Spinner() {
  return (
    <svg
      className="inline-block w-4 h-4 mr-2 animate-spin align-[-2px]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Spinner />
          Pošiljam…
        </>
      ) : (
        "Pošlji sporočilo →"
      )}
    </Button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="border border-gold/40 bg-gold/5 p-6">
        <p className="text-[17px] font-semibold text-navy font-heading mb-2">
          Hvala za sporočilo.
        </p>
        <p className="text-[15px] text-body font-body">
          Odgovorimo ti v kratkem.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {/* Honeypot — hidden from real users, bots fill it */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-navy font-body mb-2"
          >
            Ime in priimek
          </label>
          <input
            id="name"
            name="name"
            type="text"
            maxLength={200}
            placeholder="Ime in priimek"
            className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-navy font-body mb-2"
          >
            E-pošta *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="tvoj@email.si"
            className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-navy font-body mb-2"
        >
          Zadeva
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          maxLength={200}
          placeholder="Npr. Vprašanje o začetnem tečaju"
          className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-navy font-body mb-2"
        >
          Sporočilo *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          placeholder="Tvoje sporočilo..."
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
