"use client";

import { useState } from "react";
import { submitCourseApplication } from "@/lib/course-application-actions";
import { bookingFormSchema, type BookingFormInput } from "@/lib/booking-schema";
import { SubmissionSuccessCard } from "@/components/blocks/SubmissionSuccessCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  instanceId: string;
};

export function BookingFlow({ instanceId }: Props) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <SubmissionSuccessCard
        title="Prijava je poslana"
        steps={[
          "Samo preveri izbrani termin in vam odgovori po e-pošti.",
          "Po potrditvi prijave prejmete tudi podatke za plačilo 50 € akontacije.",
          "Mesto na tečaju je potrjeno po plačilu akontacije in Samovi potrditvi.",
        ]}
      >
        <p>
          Hvala za prijavo. Na e-pošto smo vam poslali potrditev prejema. Samo
          bo preveril termin in vam poslal nadaljnje informacije za potrditev
          udeležbe in račun.
        </p>
      </SubmissionSuccessCard>
    );
  }

  return <DetailsStep instanceId={instanceId} onSent={() => setSent(true)} />;
}

type DetailsStepProps = {
  instanceId: string;
  onSent: () => void;
};

function DetailsStep({ instanceId, onSent }: DetailsStepProps) {
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
      note: String(formData.get("note") ?? ""),
      acceptTerms: formData.get("acceptTerms") === "on",
      instanceId,
    };

    const parsed = bookingFormSchema.safeParse(raw);
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
    const result = await submitCourseApplication(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onSent();
  }

  return (
    <div>
      <p className="mb-10 max-w-2xl font-body text-body leading-relaxed">
        Pošljite prijavo za izbrani termin. Samo bo prijavo preveril in vam
        poslal nadaljnje informacije za potrditev udeležbe in račun.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Input
          label="Ime in priimek *"
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          error={errors.fullName}
        />
        <Input
          label="E-pošta *"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
        />
        <Input
          label="Telefon *"
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          error={errors.phone}
        />
        <div>
          <label htmlFor="note" className="mb-2 block font-body text-sm font-medium text-body">
            Opomba ali vprašanje
          </label>
          <textarea
            id="note"
            name="note"
            rows={5}
            className="w-full border border-border-custom bg-white px-4 py-3 font-body text-body outline-none transition-colors focus:border-gold"
            placeholder="Če imate vprašanje, posebnost ali dodatno željo, jo napišite tukaj."
          />
          {errors.note && <p className="mt-1 text-sm text-red-700 font-body" role="alert">{errors.note}</p>}
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
              {" "}*
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
          {submitting ? "Pošiljam prijavo…" : "Pošlji prijavo →"}
        </Button>
        <p className="font-body text-xs text-muted-text leading-relaxed">
          Prijava še ne pomeni dokončne potrditve mesta. Samo vas kontaktira z
          nadaljnjimi informacijami in računom.
        </p>
      </form>
    </div>
  );
}
