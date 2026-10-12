"use client";

import { useActionState, useEffect, useId } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { trackEmailSignup } from "@/lib/analytics";
import {
  submitStatikaGuideSignup,
  type GuideSignupState,
} from "@/lib/guide-signup-actions";

const INITIAL: GuideSignupState = { status: "idle" };

const fieldClass =
  "w-full border border-border-custom bg-white px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      className="w-full py-3"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Pošiljam..." : "Pošljite mi priročnik"}
    </Button>
  );
}

export function StatikaGuideSignup() {
  const [state, formAction] = useActionState(submitStatikaGuideSignup, INITIAL);
  // The block can appear more than once in one article, so ids must be unique.
  const id = useId();

  useEffect(() => {
    if (state.status === "success") {
      trackEmailSignup({ source: "blog_statika_guide" });
    }
  }, [state.status]);

  return (
    <div className="my-10 border border-border-custom bg-surface px-6 py-8">
      <h3 className="!mt-0 !mb-2 text-center text-xl font-semibold">
        Brezplačen priročnik: Trening statike v 8 tednih
      </h3>
      {state.status !== "success" && (
        <p className="!mb-6 text-center font-body text-body">
          Vpišite ime in e-naslov, priročnik (PDF) vam takoj pošljemo po e-pošti.
        </p>
      )}

      {state.status === "success" ? (
        <p
          className="!mb-0 text-center font-body !text-[15px] !text-navy"
          role="status"
        >
          Hvala! Priročnik je na poti, preverite svoj e-poštni predal (tudi mapo
          z vsiljeno pošto).
        </p>
      ) : (
        <form action={formAction} className="mx-auto max-w-md">
          <div
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor={`${id}-website`}>Website</label>
            <input
              id={`${id}-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor={`${id}-name`} className="sr-only">
              Ime
            </label>
            <input
              id={`${id}-name`}
              name="name"
              type="text"
              required
              maxLength={100}
              autoComplete="given-name"
              placeholder="Vaše ime"
              className={fieldClass}
            />
            <label htmlFor={`${id}-email`} className="sr-only">
              E-pošta
            </label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              placeholder="vas@email.si"
              className={fieldClass}
              aria-invalid={state.status === "error" ? "true" : undefined}
              aria-describedby={`${id}-message`}
            />
            <SubmitButton />
          </div>

          {state.status === "error" && state.message && (
            <p
              id={`${id}-message`}
              className="!mt-4 !mb-0 font-body !text-[14px] !text-red-600"
              role="alert"
            >
              {state.message}
            </p>
          )}

          <p className="!mt-4 !mb-0 text-center font-body !text-xs !text-muted-text">
            Priročnik + novice o tečajih in treningih. Brez spama. Odjavite se
            kadarkoli.
          </p>
        </form>
      )}
    </div>
  );
}
