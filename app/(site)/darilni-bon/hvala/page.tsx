import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Hvala — Povpraševanje za darilni bon prejeto",
  description: "Vaše povpraševanje za darilni bon je bilo prejeto.",
  robots: { index: false, follow: false },
};

export default function GiftVoucherHvalaPage() {
  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <Overline>Povpraševanje prejeto</Overline>
        <SectionHeading className="mb-6">Hvala za povpraševanje.</SectionHeading>

        <p className="text-[17px] text-body font-body leading-[1.7] mb-8">
          Če ste pravkar poslali povpraševanje za darilni bon, smo vam na
          e-pošto poslali potrditev prejema. Samo preveri podatke in vam pošlje
          nadaljnje informacije za plačilo oziroma račun. Bon uredimo po
          potrditvi.
        </p>

        <h2 className="text-[22px] font-semibold text-navy font-heading mb-4">Kaj sledi?</h2>
        <ol className="space-y-4 mb-10">
          {[
            "Na e-pošto prejmete potrditev, da smo povpraševanje prejeli.",
            "Samo preveri podatke in vam pošlje nadaljnje informacije za plačilo oziroma račun.",
            "Po potrditvi uredimo digitalni bon.",
            "Prejemnik se z bonom prijavi na izbrani termin tečaja po e-pošti.",
          ].map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="text-gold font-semibold text-[17px] font-body shrink-0 w-6">{i + 1}.</span>
              <span className="text-[17px] text-body font-body leading-[1.6]">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mb-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/darilni-bon">Nazaj na darilni bon</Link>
          </Button>
          <Link
            href="/vprasanja"
            className="inline-block shrink-0 border border-gold px-8 py-4 text-[15px] font-body font-medium text-gold transition-colors hover:border-gold-hover hover:text-gold-hover"
          >
            Pogosta vprašanja
          </Link>
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
