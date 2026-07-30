import Link from "next/link";
import { trainingStripe } from "@/lib/stripe/training-client";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { TrainingPaymentTracker } from "./TrainingPaymentTracker";

export const metadata = {
  title: "Prijava na trening je potrjena",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  }>;
};

export default async function TrainingThankYouPage({ searchParams }: Props) {
  const { payment_intent, payment_intent_client_secret, redirect_status } = await searchParams;
  let intent = null;
  if (payment_intent && payment_intent_client_secret) {
    try {
      const retrieved = await trainingStripe.paymentIntents.retrieve(payment_intent);
      if (retrieved.client_secret === payment_intent_client_secret) intent = retrieved;
    } catch {
      intent = null;
    }
  }

  const succeeded = intent?.status === "succeeded" || redirect_status === "succeeded";
  const paymentSucceeded = intent?.status === "succeeded";
  const metadata = intent?.metadata;

  return (
    <main className="min-h-screen bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-6">
        <div className="border border-border-custom bg-white p-8 md:p-12">
          <Overline>{succeeded ? "Prijava potrjena" : "Plačilo se obdeluje"}</Overline>
          <h1 className="mb-5 text-[36px] font-bold leading-tight text-navy">
            {succeeded ? "Vaše mesto je rezervirano." : "Hvala za prijavo."}
          </h1>
          <p className="mb-8 text-[17px] leading-relaxed text-body">
            {succeeded
              ? "Plačilo letne članarine je uspelo. Potrditev prijave in vse podrobnosti boste prejeli po e-pošti."
              : "Plačilo se še obdeluje. Potrditev boste prejeli po e-pošti takoj, ko bo zaključeno."}
          </p>
          {paymentSucceeded && intent && (
            <TrainingPaymentTracker
              transactionId={intent.id}
              value={intent.amount / 100}
              currency={intent.currency.toUpperCase()}
            />
          )}
          {metadata?.trainingProgram && (
            <dl className="mb-8 space-y-3 border-y border-border-custom py-6 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-text">Program</dt>
                <dd className="text-right font-medium text-navy">{metadata.trainingProgram}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-text">Lokacija</dt>
                <dd className="text-right font-medium text-navy">{metadata.trainingVenue}, {metadata.trainingCity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-text">Termin</dt>
                <dd className="text-right font-medium text-navy">{metadata.trainingWeekday}, {metadata.trainingTime}</dd>
              </div>
            </dl>
          )}
          <Button asChild>
            <Link href="/treningi">Nazaj na treninge</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
