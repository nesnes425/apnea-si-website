import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { stripe } from "@/lib/stripe/client";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { Button } from "@/components/ui/button";
import { splitName } from "@/lib/utils";

export const metadata = {
  title: "Hvala — Darilni bon je poslan",
  description: "Vaš darilni bon je pripravljen in poslan po e-pošti.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    payment_intent?: string;
    payment_intent_client_secret?: string;
    redirect_status?: string;
  }>;
};

export default async function GiftVoucherHvalaPage({ searchParams }: Props) {
  const { payment_intent, payment_intent_client_secret, redirect_status } = await searchParams;

  const succeeded = redirect_status === "succeeded";
  const processing = redirect_status === "processing";

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
  const buyerName = meta.buyerName;
  const recipientName = meta.recipientName;
  const recipientEmail = meta.recipientEmail;
  const firstName = buyerName ? splitName(buyerName).first : "";

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
            <Link href="/darilni-bon">← Nazaj na darilni bon</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <Overline>Darilni bon je poslan</Overline>
        <SectionHeading className="mb-6">
          {firstName ? `Hvala, ${firstName}!` : "Hvala za nakup!"}
        </SectionHeading>

        {processing && (
          <div className="bg-white border border-border-custom px-6 py-4 mb-8 text-[15px] text-body font-body">
            Vaše plačilo se obdeluje. Bon prejmete v nekaj minutah po e-pošti.
          </div>
        )}

        {recipientName && (
          <p className="text-[17px] text-body font-body leading-[1.7] mb-8">
            Bon za <strong>{recipientName}</strong> je pripravljen. Poslali smo ga vam in {recipientEmail ? `obdarjencu na ${recipientEmail}` : "obdarjencu"}.
          </p>
        )}

        <h2 className="text-[22px] font-semibold text-navy font-heading mb-4">Kaj sledi?</h2>
        <ol className="space-y-4 mb-10">
          {[
            "Vi prejmete bon kot PDF — če ga raje natisnete in osebno izročite.",
            "Obdarjenec prejme bon neposredno po e-pošti, z osebnim sporočilom (če ste ga dodali).",
            "Ko se obdarjenec odloči, kdaj želi tečaj, nam piše in skupaj izberemo termin.",
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="text-gold font-semibold text-[17px] font-body shrink-0 w-6">{i + 1}.</span>
              <span className="text-[17px] text-body font-body leading-[1.6]">{step}</span>
            </li>
          ))}
        </ol>

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
