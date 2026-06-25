import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { ContactForm } from "./ContactForm";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

export const metadata = {
  title: "Kontakt",
  description:
    "Stopite v stik z Apnea Slovenija. E-pošta: info@apnea.si, telefon: +386 41 874 187. Samo Jeranko s.p. in Športno društvo Apnea Slovenija.",
  alternates: { canonical: "/kontakt" },
};

export default function KontaktPage() {
  return (
    <>
      {/* Hero with photo */}
      <section className="relative w-full min-h-[320px] md:min-h-[400px] flex items-end">
        <Image
          src="/images/kontakt-hero.webp"
          alt="Ekipa Apnea Slovenija"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-transparent" />
        <div className="relative w-full max-w-6xl px-6 mx-auto pb-12 md:pb-16">
          <h1 className="text-[36px] md:text-[48px] font-bold leading-[1.08] tracking-[-0.02em] text-white font-heading">
            Pišite nam
          </h1>
          <p className="text-[17px] text-white/70 font-body mt-3 max-w-lg">
            Z veseljem odgovorimo na vaša vprašanja in vam pomagamo pri prvih
            korakih v svet prostega potapljanja.
          </p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24">
            {/* Left: contact details, clean and open */}
            <div>
              <div className="space-y-10">
                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                    E-pošta
                  </p>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-[22px] md:text-[26px] font-semibold text-navy font-heading hover:text-gold transition-colors"
                  >
                    {siteConfig.email}
                  </a>
                </div>

                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                    Telefon
                  </p>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="text-[22px] md:text-[26px] font-semibold text-navy font-heading hover:text-gold transition-colors"
                  >
                    {siteConfig.phone}
                  </a>
                </div>

                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                    Podatki ponudnikov
                  </p>
                  <p className="text-[17px] text-navy font-body leading-relaxed mb-4">
                    Tečaje, delavnice in darilne bone izvaja:
                    <br />
                    Inženirske in športne storitve, Samo Jeranko s.p.
                    <br />
                    Saveljska cesta 70A
                    <br />
                    1000 Ljubljana
                  </p>
                  <p className="text-[17px] text-navy font-body leading-relaxed">
                    Treninge in članstvo izvaja:
                    <br />
                    Športno društvo Apnea Slovenija
                    <br />
                    Saveljska cesta 70A
                    <br />
                    1000 Ljubljana
                  </p>
                </div>

                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                    Sledite nam
                  </p>
                  <div className="flex gap-5">
                    <a
                      href={siteConfig.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="text-navy hover:text-gold transition-colors"
                    >
                      <InstagramIcon className="w-6 h-6" />
                    </a>
                    <a
                      href={siteConfig.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="text-navy hover:text-gold transition-colors"
                    >
                      <FacebookIcon className="w-6 h-6" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              <h2 className="text-[24px] md:text-[28px] font-semibold mb-8">
                Pošljite nam sporočilo
              </h2>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
