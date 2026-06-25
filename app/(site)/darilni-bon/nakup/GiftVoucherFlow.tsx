"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { submitGiftVoucherRequest } from "@/lib/gift-voucher-request-actions";
import { giftVoucherFormSchema, type GiftVoucherFormInput } from "@/lib/gift-voucher-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GiftVoucherFlow() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="border border-green-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-green-200 bg-green-50 text-green-700">
            <CircleCheck aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
          </div>
          <div>
            <p className="mb-2 font-body text-[13px] font-medium uppercase tracking-[0.08em] text-green-700">
              Povpraševanje prejeto
            </p>
            <h2 className="mb-3 font-heading text-[26px] font-semibold leading-tight text-navy">
              Povpraševanje je poslano
            </h2>
            <p className="font-body text-body leading-relaxed">
              Hvala. Na e-pošto smo vam poslali potrditev prejema. Samo bo
              preveril podatke in vam poslal nadaljnje informacije za plačilo
              oziroma račun.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-green-100 pt-6">
          <p className="mb-4 font-body text-[15px] font-medium text-navy">
            Kaj sledi?
          </p>
          <ol className="space-y-4">
            <li className="flex gap-3 font-body text-[15px] leading-relaxed text-body">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-green-50 text-sm font-semibold text-green-700">
                1
              </span>
              <span>Samo preveri podatke za darilni bon.</span>
            </li>
            <li className="flex gap-3 font-body text-[15px] leading-relaxed text-body">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-green-50 text-sm font-semibold text-green-700">
                2
              </span>
              <span>Po e-pošti prejmete informacije za plačilo oziroma račun.</span>
            </li>
            <li className="flex gap-3 font-body text-[15px] leading-relaxed text-body">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-green-50 text-sm font-semibold text-green-700">
                3
              </span>
              <span>
                Darilni bon uredimo po potrditvi in plačilu ter ga pošljemo po
                e-pošti.
              </span>
            </li>
          </ol>
        </div>
      </div>
    );
  }

  return <DetailsStep onSent={() => setSent(true)} />;
}

type DetailsStepProps = {
  onSent: () => void;
};

function DetailsStep({ onSent }: DetailsStepProps) {
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
    const result = await submitGiftVoucherRequest(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    onSent();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <div>
        <h3 className="text-[20px] font-semibold text-navy font-heading mb-4">Vaši podatki</h3>
        <div className="space-y-6">
          <Input label="Vaše ime in priimek" id="buyerName" name="buyerName" type="text"
            autoComplete="name" required error={errors.buyerName} />
          <div>
            <Input label="E-naslov, na katerega pošljemo bon" id="buyerEmail" name="buyerEmail" type="email"
              autoComplete="email" required error={errors.buyerEmail} />
            <p className="text-xs text-muted-text font-body mt-2">
              Bon prejmete vi. Lahko ga natisnete ali prepošljete obdarjencu, ko vam ustreza.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[20px] font-semibold text-navy font-heading mb-4">Obdarjenec</h3>
        <div className="space-y-6">
          <Input label="Ime in priimek obdarjenca" id="recipientName" name="recipientName"
            type="text" required error={errors.recipientName} />

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
              Sporočilo se izpiše na bonu.
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
        {submitting ? "Pošiljam povpraševanje…" : "Pošlji povpraševanje →"}
      </Button>
      <p className="font-body text-xs text-muted-text leading-relaxed">
        Povpraševanje še ne pomeni izdanega bona. Bon uredimo po potrditvi in
        plačilu.
      </p>
    </form>
  );
}
