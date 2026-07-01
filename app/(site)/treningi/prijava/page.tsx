import Link from "next/link";
import { notFound } from "next/navigation";
import { Overline } from "@/components/blocks/Overline";
import { getTrainingGroup, getTrainingSettings } from "@/lib/sanity/queries";
import { TrainingSignupForm } from "./TrainingSignupForm";

export const metadata = {
  title: "Prijava na trening",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function TrainingSignupPage({ searchParams }: Props) {
  const { groupId } = await searchParams;
  if (!groupId) notFound();

  const [group, settings] = await Promise.all([
    getTrainingGroup(groupId),
    getTrainingSettings(),
  ]);
  if (!group) notFound();

  const applicationsOpen = settings?.applicationsOpen ?? false;
  const pricing = {
    ...group.venue.defaultPricing,
    ...group.pricingOverride,
  };
  const membershipFee = settings?.membershipFee ?? 35;

  return (
    <main className="min-h-screen bg-surface py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/treningi#prijava" className="mb-8 inline-block text-sm text-gold hover:text-gold-hover">
          ← Nazaj na urnik
        </Link>
        <div className="grid gap-8 md:grid-cols-[1fr_380px]">
          <section className="bg-white p-7 md:p-10">
            <Overline>Prijava na trening</Overline>
            <h1 className="mb-4 text-[34px] font-bold leading-tight text-navy">
              Rezervirajte mesto v skupini
            </h1>
            <p className="mb-8 text-body">
              Po oddaji podatkov bomo mesto zadržali {settings?.holdMinutes ?? 15} minut.
              Danes plačate samo {membershipFee} € letne članarine. S plačilom je
              vaše mesto v skupini potrjeno.
            </p>
            <TrainingSignupForm
              groupId={group._id}
              applicationsOpen={applicationsOpen}
              membershipFee={membershipFee}
              stripeConfigured={Boolean(process.env.NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY)}
            />
          </section>
          <aside className="self-start border border-border-custom bg-white p-7">
            <Overline>Izbrana skupina</Overline>
            <h2 className="mb-2 text-[24px] font-semibold leading-tight text-navy">
              {group.program.name}
            </h2>
            <p className="mb-1 text-body">{group.venue.name}, {group.venue.city}</p>
            <p className="mb-5 text-sm font-medium text-navy">
              {group.weekday}, {group.startTime}–{group.endTime}
            </p>
            <dl className="space-y-3 border-t border-border-custom pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-text">Mesečna vadnina</dt>
                <dd className="font-medium text-navy">{pricing.monthlyDisplayPrice} €/mesec</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-text">Plačilo vadnine</dt>
                <dd className="text-right font-medium text-navy">
                  {pricing.secondInstallmentAmount > 0
                    ? `1. obrok ${pricing.firstInstallmentAmount} €, 2. obrok ${pricing.secondInstallmentAmount} €`
                    : `${pricing.firstInstallmentAmount} € enkratno`}
                </dd>
              </div>
              <div className="border-t border-border-custom pt-3">
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-navy">Danes plačate</dt>
                  <dd className="text-right font-semibold text-navy">{membershipFee} € članarine</dd>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-navy">
                  S plačilom članarine je vaše mesto v skupini potrjeno.
                </p>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
