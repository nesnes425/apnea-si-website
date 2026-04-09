import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";

export const metadata = {
  title: "Kontakt",
  description:
    "Kontaktirajte Apnea Slovenija. E-pošta: info@apnea.si, telefon: +386 41 874 187. Športno društvo Apnea Slovenija, Saveljska cesta 70A, Ljubljana.",
};

export default function KontaktPage() {
  return (
    <>
      {/* Hero */}
      <Section>
        <div className="max-w-2xl">
          <Overline>Kontakt</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-6">
            Pišite nam
          </h1>
          <p className="text-[17px] text-body leading-[1.6] font-body">
            Z veseljem odgovorimo na vaša vprašanja in vam pomagamo pri prvih
            korakih v svet prostega potapljanja.
          </p>
        </div>
      </Section>

      {/* Contact info + form */}
      <Section surface>
        <div className="grid md:grid-cols-[1fr_1fr] gap-16">
          {/* Contact info */}
          <div>
            <SectionHeading className="mb-8">
              Kontaktni podatki
            </SectionHeading>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-text font-body mb-1">
                  E-pošta
                </p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-[17px] text-gold font-body hover:text-gold-hover transition-colors"
                >
                  {siteConfig.email}
                </a>
              </div>

              <div>
                <p className="text-sm text-muted-text font-body mb-1">
                  Telefon
                </p>
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="text-[17px] text-gold font-body hover:text-gold-hover transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </div>

              <div>
                <p className="text-sm text-muted-text font-body mb-1">
                  Naslov
                </p>
                <p className="text-[17px] text-navy font-body">
                  Športno društvo Apnea Slovenija
                  <br />
                  Saveljska cesta 70A
                  <br />
                  1000 Ljubljana
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-text font-body mb-1">
                  Družbena omrežja
                </p>
                <div className="flex gap-4">
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] text-gold font-body hover:text-gold-hover transition-colors"
                  >
                    Instagram
                  </a>
                  <a
                    href={siteConfig.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] text-gold font-body hover:text-gold-hover transition-colors"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form placeholder */}
          <div>
            <SectionHeading className="mb-8">Pišite nam</SectionHeading>
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
                  placeholder="Zadeva sporočila"
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
                  rows={5}
                  placeholder="Vaše sporočilo..."
                  className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors"
              >
                Pošlji →
              </button>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}
