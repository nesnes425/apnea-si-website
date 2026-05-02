import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { GiftVoucherFlow } from "./GiftVoucherFlow";

export const metadata = {
  title: "Nakup darilnega bona — Apnea Slovenija",
  description: "Podarite tečaj prostega potapljanja. Digitalni darilni bon, veljaven 1 leto.",
  robots: { index: false, follow: false },
};

// Payment page — never useful to prerender, and prerender evaluates the
// client-side Stripe loader which throws without NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
export const dynamic = "force-dynamic";

export default function GiftVoucherPurchasePage() {
  const voucher = siteConfig.giftVoucher;

  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href="/darilni-bon"
          className="text-sm text-gold hover:text-gold-hover transition-colors font-body inline-block mb-8"
        >
          ← Nazaj na darilni bon
        </Link>

        <Overline>Nakup darilnega bona</Overline>
        <SectionHeading className="mb-10">{voucher.fullName}</SectionHeading>

        <div className="grid md:grid-cols-[1fr_320px] gap-12">
          <GiftVoucherFlow />

          <aside className="md:sticky md:top-24 self-start">
            <div className="bg-white p-8 border border-border-custom">
              <Overline>Vaš bon</Overline>
              <p className="text-[20px] font-semibold text-navy font-heading leading-tight mt-2 mb-4">
                {voucher.name}
              </p>

              <p className="text-[40px] font-bold text-navy font-heading leading-none mb-1">
                €{voucher.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-6">
                Vse vključeno. Brez skritih stroškov.
              </p>

              <CheckList
                items={[
                  "SSI Freediving Level 1",
                  "Teorija + bazen + morje",
                  `Veljavnost ${voucher.validityMonths} mesecev`,
                  "Digitalni bon — pošljemo po e-pošti",
                ]}
              />

              <p className="mt-6 pt-6 border-t border-border-custom text-xs text-muted-text font-body leading-relaxed">
                Bon prejmete vi in obdarjenec po e-pošti takoj po plačilu. Termin tečaja izberete v dogovoru z nami.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
