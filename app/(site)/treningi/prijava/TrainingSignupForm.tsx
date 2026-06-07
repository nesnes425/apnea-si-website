"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTrainingPaymentIntent,
  validateTrainingPaymentHold,
} from "@/lib/stripe/training-actions";
import { getTrainingStripe } from "@/lib/stripe/training-client-side";
import {
  trainingReservationSchema,
  type TrainingReservationInput,
} from "@/lib/training-reservation-schema";

type Props = {
  groupId: string;
  applicationsOpen: boolean;
  membershipFee: number;
  stripeConfigured: boolean;
};

type IntentState = {
  clientSecret: string;
  email: string;
  token: string;
  expiresAt: string;
};

const trainingStripePromise = getTrainingStripe();

const elementsAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#d3a356",
    colorText: "#33404f",
    colorDanger: "#b3261e",
    fontFamily: "Roboto, system-ui, sans-serif",
    borderRadius: "0px",
    spacingUnit: "4px",
  },
};

export function TrainingSignupForm({
  groupId,
  applicationsOpen,
  membershipFee,
  stripeConfigured,
}: Props) {
  const [intent, setIntent] = useState<IntentState | null>(null);

  if (!applicationsOpen) {
    return (
      <div className="border border-gold/30 bg-gold-pale p-5 text-sm leading-relaxed text-navy">
        Spletne prijave so trenutno zaprte. Pišite nam na{" "}
        <a className="font-medium text-gold underline" href="mailto:info@apnea.si">
          info@apnea.si
        </a>
        , da skupaj poiščemo primerno skupino.
      </div>
    );
  }

  if (!stripeConfigured) {
    return (
      <div className="border border-gold/30 bg-gold-pale p-5 text-sm leading-relaxed text-navy">
        Plačila za treninge še pripravljamo. Za prijavo nam trenutno pišite na{" "}
        <a className="font-medium text-gold underline" href="mailto:info@apnea.si">
          info@apnea.si
        </a>
        .
      </div>
    );
  }

  if (intent) {
    return (
      <Elements
        stripe={trainingStripePromise}
        options={{ clientSecret: intent.clientSecret, appearance: elementsAppearance, locale: "sl" }}
      >
        <PaymentStep
          groupId={groupId}
          customerEmail={intent.email}
          token={intent.token}
          expiresAt={intent.expiresAt}
          membershipFee={membershipFee}
        />
      </Elements>
    );
  }

  return <DetailsStep groupId={groupId} onIntentCreated={setIntent} />;
}

function DetailsStep({
  groupId,
  onIntentCreated,
}: {
  groupId: string;
  onIntentCreated: (intent: IntentState) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    const raw: TrainingReservationInput = {
      groupId,
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      acceptTerms: formData.get("acceptTerms") === "on",
    };
    const parsed = trainingReservationSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0] ?? "")] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await createTrainingPaymentIntent(parsed.data);
    setSubmitting(false);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onIntentCreated({
      clientSecret: result.clientSecret,
      email: parsed.data.email,
      token: result.token,
      expiresAt: result.expiresAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input label="Ime in priimek" id="fullName" name="fullName" autoComplete="name" required error={errors.fullName} />
      <Input label="E-pošta" id="email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <Input label="Telefon" id="phone" name="phone" type="tel" autoComplete="tel" required error={errors.phone} />
      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="acceptTerms" className="mt-1 h-4 w-4 shrink-0 accent-gold" />
          <span className="text-sm leading-relaxed text-body">
            Strinjam se s <a href="/pogoji" target="_blank" className="text-gold underline">pogoji poslovanja</a> in{" "}
            <a href="/zasebnost" target="_blank" className="text-gold underline">politiko zasebnosti</a>.
          </span>
        </label>
        {errors.acceptTerms && <p className="mt-1 text-sm text-red-700" role="alert">{errors.acceptTerms}</p>}
      </div>
      {serverError && <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{serverError}</p>}
      <Button type="submit" disabled={submitting} fullWidth>
        {submitting ? "Pripravljam plačilo…" : "Naprej k plačilu →"}
      </Button>
    </form>
  );
}

function PaymentStep({
  groupId,
  customerEmail,
  token,
  expiresAt,
  membershipFee,
}: {
  groupId: string;
  customerEmail: string;
  token: string;
  expiresAt: string;
  membershipFee: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    function updateCountdown() {
      setSecondsRemaining(
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      );
    }
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);
    const validation = await validateTrainingPaymentHold({ groupId, token });
    if (!validation.ok) {
      setError(validation.error);
      setSubmitting(false);
      return;
    }

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/treningi/hvala`,
        receipt_email: customerEmail,
      },
    });
    if (submitError) {
      setError(submitError.message ?? "Napaka pri plačilu. Poskusite znova.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gold/30 bg-gold-pale p-4 text-sm text-navy">
        Mesto je za vas rezervirano še <strong>{minutes}:{seconds}</strong>.
      </div>
      <div>
        <h2 className="mb-2 text-[22px] font-semibold text-navy">Plačilo članarine</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-text">
          S plačilom letne članarine {membershipFee} € dokončno rezervirate mesto
          v izbrani skupini. Plačilo poteka varno preko Stripe.
        </p>
        <PaymentElement />
      </div>
      {error && <p className="border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
      <Button type="submit" disabled={!stripe || submitting || secondsRemaining === 0} fullWidth>
        {submitting ? "Plačujem…" : `Plačajte ${membershipFee} € in rezervirajte mesto →`}
      </Button>
    </form>
  );
}
