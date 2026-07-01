"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { trackEmailSignup } from "@/lib/analytics";
import {
  submitNewsletterSignup,
  type NewsletterSignupState,
} from "./newsletter-actions";

const INITIAL: NewsletterSignupState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      className="w-full py-3 sm:w-auto"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Prijavljam..." : "Prijava na novice"}
    </Button>
  );
}

export function LeadMagnetSignup() {
  const [state, formAction] = useActionState(submitNewsletterSignup, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      trackEmailSignup({ source: "homepage_equalization_guide" });
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="max-w-md mx-auto">
      <div
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="leadmagnet-website">Website</label>
        <input
          id="leadmagnet-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="leadmagnet-email" className="sr-only">
          E-pošta
        </label>
        <input
          id="leadmagnet-email"
          name="email"
          type="email"
          required
          maxLength={200}
          placeholder="vas@email.si"
          className="flex-1 border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
          aria-invalid={state.status === "error" ? "true" : undefined}
          aria-describedby="leadmagnet-message"
        />
        <SubmitButton />
      </div>

      {state.status === "success" && (
        <p
          id="leadmagnet-message"
          className="text-[14px] text-navy font-body mt-4"
          role="status"
        >
          Hvala, prijava je urejena. Posnetek prejmete na vpisani e-naslov.
        </p>
      )}

      {state.status === "error" && state.message && (
        <p
          id="leadmagnet-message"
          className="text-[14px] text-red-600 font-body mt-4"
          role="alert"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
