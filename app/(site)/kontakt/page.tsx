import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Kontakt",
  description:
    "Kontaktirajte Apnea Slovenija. E-pošta: info@apnea.si, telefon: +386 41 874 187. Športno društvo Apnea Slovenija, Saveljska cesta 70A, Ljubljana.",
};

export default function KontaktPage() {
  return (
    <>
      {/* Hero with photo */}
      <section className="relative w-full min-h-[320px] md:min-h-[400px] flex items-end">
        <Image
          src="/images/placeholder/tecaj-skupina.jpg"
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

      {/* Contact info + form — two column */}
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
                  <p className="text-[15px] text-muted-text font-body mt-2">
                    Za vprašanja o tečajih, treningih in prijave
                  </p>
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
                  <p className="text-[15px] text-muted-text font-body mt-2">
                    Za nujna vprašanja ali spremembe rezervacij
                  </p>
                </div>

                <div>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                    Naslov
                  </p>
                  <p className="text-[17px] text-navy font-body leading-relaxed">
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
                  <div className="flex gap-6">
                    <a
                      href={siteConfig.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] text-navy font-medium font-body hover:text-gold transition-colors"
                    >
                      Instagram
                    </a>
                    <a
                      href={siteConfig.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] text-navy font-medium font-body hover:text-gold transition-colors"
                    >
                      Facebook
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div>
              <h2 className="text-[24px] md:text-[28px] font-semibold mb-2">
                Pošljite nam sporočilo
              </h2>
              <p className="text-[15px] text-muted-text font-body mb-8">
                Odgovorimo v roku 1–2 delovnih dni.
              </p>

              <form className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-navy font-body mb-2"
                    >
                      Ime in priimek
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Ime in priimek"
                      className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-navy font-body mb-2"
                    >
                      E-pošta *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="vas@email.si"
                      className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-navy font-body mb-2"
                  >
                    Zadeva
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Npr. Vprašanje o začetnem tečaju"
                    className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-navy font-body mb-2"
                  >
                    Sporočilo *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    placeholder="Vaše sporočilo..."
                    className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors resize-none"
                  />
                </div>

                <Button type="submit">Pošlji sporočilo →</Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
