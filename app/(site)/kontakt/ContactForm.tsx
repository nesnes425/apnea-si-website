"use client";

import Script from "next/script";
import { useActionState, useCallback, useEffect, useRef } from "react";
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

type ContactFormProps = {
  turnstileSiteKey: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function ContactForm({
  turnstileSiteKey,
  subjectPlaceholder = "Npr. Vprašanje o začetnem tečaju",
  messagePlaceholder = "Vaše sporočilo...",
}: ContactFormProps) {
  const [state, formAction] = useActionState(submitContactForm, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileRef.current || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      action: "contact-form",
      theme: "light",
      appearance: "interaction-only",
    });
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    } else if (state.status === "error" && widgetIdRef.current) {
      window.turnstile?.reset(widgetIdRef.current);
    }
  }, [state]);

  if (state.status === "success") {
    return (
      <div className="border border-gold/40 bg-gold/5 p-6">
        <p className="text-[17px] font-semibold text-navy font-heading mb-2">
          Hvala za sporočilo.
        </p>
        <p className="text-[15px] text-body font-body">
          Odgovorimo vam v kratkem.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderTurnstile}
      />
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
            placeholder="vas@email.si"
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
          placeholder={subjectPlaceholder}
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
          placeholder={messagePlaceholder}
          className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors resize-none"
        />
      </div>

      {state.status === "error" && state.message && (
        <p className="text-[14px] text-red-600 font-body" role="alert">
          {state.message}
        </p>
      )}

      <div ref={turnstileRef} />

      <SubmitButton />
    </form>
  );
}
