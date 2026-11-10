import Link from "next/link";
import { notFound } from "next/navigation";
import { Overline } from "@/components/blocks/Overline";
import { getTrainingGroup, getTrainingSettings } from "@/lib/sanity/queries";
import { TrainingSignupForm } from "./TrainingSignupForm";
import { StatikaSignupForm } from "./StatikaSignupForm";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Prijava na trening",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ groupId?: string; mode?: string }>;
};

export default async function TrainingSignupPage({ searchParams }: Props) {
  const { groupId, mode } = await searchParams;
  if (!groupId) notFound();
  const statikaMode = mode === "statika";
  if (statikaMode && groupId !== siteConfig.trainings.statikaGroupId) notFound();

  const [group, settings] = await Promise.all([
    getTrainingGroup(groupId),
    getTrainingSettings(),
  ]);
  if (!group || !group.active || !group.venue.active || !group.program.active) notFound();

  const applicationsOpen = settings?.applicationsOpen ?? false;
  const pricing = {
    ...group.venue.defaultPricing,
    ...group.pricingOverride,
  };
  const membershipFee = settings?.membershipFee ?? 35;
  const preview = process.env.NODE_ENV === "development" &&
    process.env.TRAINING_SIGNUP_PREVIEW === "true" && !process.env.VERCEL;

  return (
    <main className="min-h-screen bg-surface py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/treningi#prijava" className="mb-8 inline-block text-sm text-gold hover:text-gold-hover">
          ← Nazaj na urnik
        </Link>
        <div className="grid gap-8 md:grid-cols-[1fr_380px]">
          <section className="bg-white p-7 md:p-10">
            <Overline>{statikaMode ? "Statika za obstoječe člane" : "Prijava na trening"}</Overline>
            <h1 className="mb-4 text-[34px] font-bold leading-tight text-navy">
              {statikaMode ? "Prijava na statiko brez plačila" : "Rezervirajte mesto v skupini"}
            </h1>
            <p className="mb-8 text-body">
              {statikaMode ? "Če ste članarino za tekočo sezono že poravnali, se lahko tukaj prijavite na statiko brez ponovnega plačila. Če plačila ne prepoznamo, prijavo pregledamo in vam odgovorimo po e-pošti." : <>Po oddaji podatkov bomo mesto zadržali {settings?.holdMinutes ?? 15} minut.
              Danes plačate samo {membershipFee} € letne članarine. S plačilom je
              vaše mesto v skupini potrjeno.</>}
            </p>
            {statikaMode ? <StatikaSignupForm
              groupId={group._id}
              applicationsOpen={applicationsOpen}
              isFull={group.isFull}
              preview={preview}
            /> : <>
            {group._id === siteConfig.trainings.statikaGroupId && (
              <div className="mb-7 border border-gold/30 bg-gold-pale p-5 text-sm leading-relaxed text-navy">
                <p className="mb-2">Ste članarino za to sezono že poravnali?</p>
                <Link className="font-semibold underline underline-offset-4" href={`/treningi/prijava?groupId=${group._id}&mode=statika`}>
                  Prijava na statiko brez plačila →
                </Link>
              </div>
            )}
            <TrainingSignupForm
              groupId={group._id}
              applicationsOpen={applicationsOpen}
              membershipFee={membershipFee}
              stripeConfigured={Boolean(process.env.NEXT_PUBLIC_TRAINING_STRIPE_PUBLISHABLE_KEY)}
            />
            </>}
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
              {statikaMode ? <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-text">Ob tej prijavi</dt>
                  <dd className="text-right font-semibold text-navy">Brez plačila članarine</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-text">Vadnina</dt>
                  <dd className="text-right font-medium text-navy">Ureja se ločeno</dd>
                </div>
                <div className="border-t border-border-custom pt-4 leading-relaxed text-body">
                  <p>Obstoječa prijava na druge treninge ostane veljavna.</p>
                  <p className="mt-3">Vpis v tabelo treningov uredimo ob administrativnem pregledu.</p>
                </div>
              </> : <>
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
              </>}
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}
