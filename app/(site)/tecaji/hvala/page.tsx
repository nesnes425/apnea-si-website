import Link from "next/link";
import { siteConfig, type CourseType } from "@/lib/config";
import { stripe } from "@/lib/stripe/client";
import { formatCourseDateRange, splitName } from "@/lib/utils";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { Button } from "@/components/ui/button";

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

function isCourseType(value: string | undefined): value is CourseType {
  return value !== undefined && value in siteConfig.courses;
}

export default async function HvalaPage({ searchParams }: Props) {
  const { payment_intent, payment_intent_client_secret, redirect_status } = await searchParams;

  const succeeded = redirect_status === "succeeded";
  const processing = redirect_status === "processing";

  // Personalize only when the PaymentIntent's client_secret query param matches
  // the retrieved intent. PI IDs alone leak via referrers/history and aren't
  // proof of ownership; the client_secret is cryptographic.
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
  const courseName = isCourseType(meta.courseType)
    ? siteConfig.courses[meta.courseType].fullName
    : null;
  const dateRange =
    meta.courseStartDate && meta.courseEndDate
      ? formatCourseDateRange(meta.courseStartDate, meta.courseEndDate)
      : null;
  const location = meta.courseLocation;
  const customerName = meta.customerName;
  const firstName = customerName ? splitName(customerName).first : "";

  if (!succeeded && !processing) {
    return (
      <section className="bg-surface min-h-screen py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <Overline>Plačilo ni bilo izvedeno</Overline>
          <SectionHeading className="mb-6">Nekaj je šlo narobe</SectionHeading>
          <p className="text-[17px] text-body font-body leading-[1.7] mb-8">
            Plačilo ni uspelo. Poskusite znova ali nas kontaktirajte, če težava ostaja.
          </p>
          <Button asChild>
            <Link href="/tecaji/zacetni#termini">← Nazaj na tečaj</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <Overline>Prijava potrjena</Overline>
        <SectionHeading className="mb-6">
          {firstName ? `Hvala, ${firstName}!` : "Hvala za prijavo!"}
        </SectionHeading>

        {processing && (
          <div className="bg-white border border-border-custom px-6 py-4 mb-8 text-[15px] text-body font-body">
            Vaše plačilo se obdeluje. Potrditveni e-mail prejmete v nekaj minutah.
          </div>
        )}

        <div className="bg-white border border-border-custom p-8 mb-10">
          {courseName && (
            <>
              <p className="text-sm text-muted-text font-body uppercase tracking-wider mb-2">
                Vaš tečaj
              </p>
              <p className="text-[22px] font-semibold text-navy font-heading mb-1">
                {courseName}
              </p>
            </>
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
