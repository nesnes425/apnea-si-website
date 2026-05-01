import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { stripe } from "@/lib/stripe/client";
import { formatCourseDateRange } from "@/lib/utils";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";

export const metadata = {
  title: "Hvala — Prijava potrjena",
  description: "Vaša prijava na tečaj prostega potapljanja je potrjena.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  }>;
};

const courseLabels: Record<string, string> = {
  zacetni: "Začetni tečaj prostega potapljanja",
  nadaljevalni: "Nadaljevalni tečaj prostega potapljanja",
  master: "Master tečaj prostega potapljanja",
};

export default async function HvalaPage({ searchParams }: Props) {
  const { payment_intent, payment_intent_client_secret, redirect_status } = await searchParams;

  const succeeded = redirect_status === "succeeded";
  const processing = redirect_status === "processing";

  // Only personalize if BOTH the payment_intent ID and its client_secret are
  // present and match. The client_secret is cryptographic; without it, the PI ID
  // alone is insufficient proof that this user owns the payment (PI IDs leak via
  // referrers, browser history, etc.).
  let intent = null;
  if (payment_intent && payment_intent_client_secret) {
    try {
      const retrieved = await stripe.paymentIntents.retrieve(payment_intent);
      if (retrieved.client_secret === payment_intent_client_secret) {
        intent = retrieved;
      }
    } catch {
      // intent not found or invalid — render generic confirmation
    }
  }

  const meta = intent?.metadata ?? {};
  const courseType = meta.courseType as string | undefined;
  const courseName = courseType ? courseLabels[courseType] : null;
  const dateRange =
    meta.courseStartDate && meta.courseEndDate
      ? formatCourseDateRange(meta.courseStartDate, meta.courseEndDate)
      : null;
  const location = meta.courseLocation as string | undefined;
  const customerName = meta.customerName as string | undefined;

  if (!succeeded && !processing) {
    return (
      <section className="bg-surface min-h-screen py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Overline>Plačilo ni bilo izvedeno</Overline>
          <SectionHeading className="mb-6">Nekaj je šlo narobe</SectionHeading>
          <p className="text-[17px] text-body font-body leading-[1.7] mb-8">
            Plačilo ni uspelo. Poskusite znova ali nas kontaktirajte, če težava ostaja.
          </p>
          <Link
            href="/tecaji/zacetni#termini"
            className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
          >
            ← Nazaj na tečaj
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <Overline>Prijava potrjena</Overline>
        <SectionHeading className="mb-6">
          {customerName ? `Hvala, ${customerName.split(" ")[0]}!` : "Hvala za prijavo!"}
        </SectionHeading>

        {processing && (
          <div className="bg-white border border-border-custom px-6 py-4 mb-8 text-[15px] text-body font-body">
            Vaše plačilo se obdeluje. Potrditveni e-mail prejmete v nekaj minutah.
          </div>
        )}

        <div className="bg-white border border-border-custom p-8 mb-10">
          {courseName && (
            <p className="text-sm text-muted-text font-body uppercase tracking-wider mb-2">
              Vaš tečaj
            </p>
          )}
          {courseName && (
            <p className="text-[22px] font-semibold text-navy font-heading mb-1">
              {courseName}
            </p>
          )}
          {(dateRange || location) && (
            <p className="text-[17px] text-body font-body">
              {dateRange}
              {dateRange && location && " · "}
              {location}
            </p>
          )}
        </div>

        <h2 className="text-[22px] font-semibold text-navy font-heading mb-4">
          Kaj sledi?
        </h2>
        <ol className="space-y-4 mb-10">
          {[
            "Potrditveni e-mail s podrobnostmi prejmete v nekaj minutah.",
            "1 teden pred tečajem prejmete navodila za pripravo in seznam, kaj prinesti.",
            "Pridete na tečaj — vse ostalo uredimo mi.",
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="text-gold font-semibold text-[17px] font-body shrink-0 w-6">
                {i + 1}.
              </span>
              <span className="text-[17px] text-body font-body leading-[1.6]">
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="bg-white border border-border-custom p-6 mb-10">
          <p className="text-sm text-muted-text font-body uppercase tracking-wider mb-3">
            Kaj prinesti
          </p>
          <p className="text-[17px] text-body font-body leading-[1.6]">
            Kopalke, brisačo in dobro voljo. Vso opremo (masko, plavuti, utežni pas, obleko) si lahko izposodite na samem tečaju.
          </p>
        </div>

        <div className="border-t border-border-custom pt-8">
          <p className="text-sm text-muted-text font-body mb-2">Kontakt</p>
          <p className="text-[17px] text-body font-body">
            <a href={`mailto:${siteConfig.email}`} className="text-gold hover:text-gold-hover transition-colors">
              {siteConfig.email}
            </a>
            {" · "}
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="text-gold hover:text-gold-hover transition-colors">
              {siteConfig.phone}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
