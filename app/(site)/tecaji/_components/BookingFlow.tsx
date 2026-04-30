"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/client-side";
import { createBookingPaymentIntent } from "@/lib/stripe/actions";
import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";

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
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-navy font-body mb-2">
          Ime in priimek
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="w-full px-4 py-3 border border-border-custom bg-white text-navy font-body focus:outline-none focus:border-gold transition-colors"
        />
        {errors.fullName && <p className="text-sm text-red-700 mt-1 font-body">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy font-body mb-2">
          E-pošta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-4 py-3 border border-border-custom bg-white text-navy font-body focus:outline-none focus:border-gold transition-colors"
        />
        {errors.email && <p className="text-sm text-red-700 mt-1 font-body">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-navy font-body mb-2">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          className="w-full px-4 py-3 border border-border-custom bg-white text-navy font-body focus:outline-none focus:border-gold transition-colors"
        />
        {errors.phone && <p className="text-sm text-red-700 mt-1 font-body">{errors.phone}</p>}
      </div>

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
        {errors.acceptTerms && <p className="text-sm text-red-700 mt-1 font-body">{errors.acceptTerms}</p>}
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-body">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Pripravljam plačilo…" : "Naprej k plačilu →"}
      </button>
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
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-body">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Plačujem…" : "Plačaj in rezerviraj →"}
      </button>
    </form>
  );
}
