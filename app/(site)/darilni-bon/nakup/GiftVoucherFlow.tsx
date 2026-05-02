"use client";

import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/client-side";
import { createGiftVoucherPaymentIntent } from "@/lib/stripe/gift-voucher-actions";
import { giftVoucherFormSchema, type GiftVoucherFormInput } from "@/lib/gift-voucher-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IntentState = { clientSecret: string };

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

export function GiftVoucherFlow() {
  const [intent, setIntent] = useState<IntentState | null>(null);

  if (intent) {
    return (
      <Elements
        stripe={stripePromise}
        options={{ clientSecret: intent.clientSecret, appearance: elementsAppearance, locale: "sl" }}
      >
        <PaymentStep />
      </Elements>
    );
  }

  return <DetailsStep onIntentCreated={setIntent} />;
}

// === Step 1: buyer + recipient details ===

type DetailsStepProps = {
  onIntentCreated: (intent: IntentState) => void;
};

function DetailsStep({ onIntentCreated }: DetailsStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const raw: GiftVoucherFormInput = {
      buyerName: String(formData.get("buyerName") ?? ""),
      buyerEmail: String(formData.get("buyerEmail") ?? ""),
      recipientName: String(formData.get("recipientName") ?? ""),
      recipientEmail: String(formData.get("recipientEmail") ?? ""),
      message: String(formData.get("message") ?? ""),
      acceptTerms: formData.get("acceptTerms") === "on",
    };

    const parsed = giftVoucherFormSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await createGiftVoucherPaymentIntent(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onIntentCreated({ clientSecret: result.clientSecret });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div>
        <h3 className="text-[20px] font-semibold text-navy font-heading mb-4">Vaši podatki</h3>
        <div className="space-y-6">
          <Input label="Vaše ime in priimek" id="buyerName" name="buyerName" type="text"
            autoComplete="name" required error={errors.buyerName} />
          <Input label="Vaš e-naslov" id="buyerEmail" name="buyerEmail" type="email"
            autoComplete="email" required error={errors.buyerEmail} />
        </div>
      </div>

      <div>
        <h3 className="text-[20px] font-semibold text-navy font-heading mb-4">Podatki obdarjenca</h3>
        <div className="space-y-6">
          <Input label="Ime in priimek obdarjenca" id="recipientName" name="recipientName"
            type="text" required error={errors.recipientName} />
          <Input label="E-naslov obdarjenca" id="recipientEmail" name="recipientEmail"
            type="email" required error={errors.recipientEmail} />

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-navy font-body mb-2">
              Osebno sporočilo (opcijsko)
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={500}
              placeholder="Npr. 'Vse najboljše za rojstni dan! Užival/a boš.'"
              className="w-full px-4 py-3 border border-border-custom bg-white text-navy font-body focus:outline-none focus:border-gold transition-colors resize-y"
            />
            {errors.message && <p className="text-sm text-red-700 mt-1 font-body" role="alert">{errors.message}</p>}
            <p className="text-xs text-muted-text font-body mt-2">
              Sporočilo se izpiše na bonu in v e-pošti, ki jo prejme obdarjenec.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="acceptTerms" className="mt-1 h-4 w-4 accent-gold shrink-0" required />
          <span className="text-sm text-body font-body leading-relaxed">
            Strinjam se s{" "}
            <a href="/pogoji" target="_blank" className="text-gold hover:text-gold-hover underline">pogoji poslovanja</a>{" "}
            in{" "}
            <a href="/zasebnost" target="_blank" className="text-gold hover:text-gold-hover underline">politiko zasebnosti</a>.
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

function PaymentStep() {
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
        return_url: `${window.location.origin}/darilni-bon/hvala`,
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
        <h2 className="text-[22px] font-semibold text-navy font-heading mb-2">Plačilo</h2>
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
        {submitting ? "Plačujem…" : "Plačaj in pošlji bon →"}
      </Button>
    </form>
  );
}
