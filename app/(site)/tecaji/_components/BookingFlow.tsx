"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/client-side";
import { createBookingPaymentIntent } from "@/lib/stripe/actions";
import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  instanceId: string;
  courseLabel: string;
  dateRange: string;
  location: string;
  priceInEuros: number;
};

const stripePromise = getStripe();

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

export function BookingFlow(props: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  if (clientSecret) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: elementsAppearance, locale: "sl" }}
      >
        <PaymentStep customerEmail={customerEmail ?? ""} />
      </Elements>
    );
  }

  return (
    <DetailsStep
      instanceId={props.instanceId}
      courseLabel={props.courseLabel}
      dateRange={props.dateRange}
      location={props.location}
      priceInEuros={props.priceInEuros}
      onIntentCreated={(secret, email) => {
        setCustomerEmail(email);
        setClientSecret(secret);
      }}
    />
  );
}

// === Step 1: customer details ===

type DetailsStepProps = Props & {
  onIntentCreated: (clientSecret: string, email: string) => void;
};

function DetailsStep({
  instanceId,
  onIntentCreated,
}: DetailsStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const raw: BookingFormInput = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      acceptTerms: formData.get("acceptTerms") === "on" ? true : (false as unknown as true),
      instanceId,
    };

    const parsed = bookingFormSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await createBookingPaymentIntent(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onIntentCreated(result.clientSecret, parsed.data.email);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Input
        label="Ime in priimek"
        id="fullName"
        name="fullName"
        type="text"
        autoComplete="name"
        required
        error={errors.fullName}
      />
      <Input
        label="E-pošta"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={errors.email}
      />
      <Input
        label="Telefon"
        id="phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        required
        error={errors.phone}
      />

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-1 h-4 w-4 accent-gold shrink-0"
            required
          />
          <span className="text-sm text-body font-body leading-relaxed">
            Strinjam se s{" "}
            <a href="/pogoji" target="_blank" className="text-gold hover:text-gold-hover underline">
              pogoji poslovanja
            </a>{" "}
            in{" "}
            <a href="/zasebnost" target="_blank" className="text-gold hover:text-gold-hover underline">
              politiko zasebnosti
            </a>
            .
          </span>
        </label>
        {errors.acceptTerms && <p className="text-sm text-red-700 mt-1 font-body" role="alert">{errors.acceptTerms}</p>}
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-body" role="alert">
          {serverError}
        </div>
      )}

      <Button type="submit" disabled={submitting} fullWidth className="md:w-auto">
        {submitting ? "Pripravljam plačilo…" : "Naprej k plačilu →"}
      </Button>
    </form>
  );
}

// === Step 2: payment ===

function PaymentStep({ customerEmail }: { customerEmail: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tecaji/hvala`,
        receipt_email: customerEmail || undefined,
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Napaka pri plačilu. Poskusite znova.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-[22px] font-semibold text-navy font-heading mb-2">
          Plačilo
        </h2>
        <p className="text-sm text-muted-text font-body mb-6">
          Plačilo poteka varno preko Stripe. Sprejemamo kartice, Apple Pay in Google Pay.
        </p>
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-body" role="alert">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!stripe || submitting} fullWidth>
        {submitting ? "Plačujem…" : "Plačaj in rezerviraj →"}
      </Button>
    </form>
  );
}
