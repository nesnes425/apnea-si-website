import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";
import { FAQ } from "@/components/blocks/FAQ";
import { pageMetadata } from "@/lib/seo";
import { SpeakingInquiryForm } from "./SpeakingInquiryForm";

export const metadata = pageMetadata({
  title: "Predavanja za podjetja",
  description:
    "Samo Jeranko, TEDx govornik in eden najuspešnejših slovenskih prostih potapljačev. Predavanja o dihanju, stresu in pripravi na zahtevne trenutke.",
  path: "/predavanja",
  image: "/images/predavanja-hero.webp",
  imageAlt: "Samo Jeranko na predavanju za podjetja",
});

const eventPhotos = [
  { src: "/images/predavanja-galerija-1.webp", alt: "Samo Jeranko na TEDx Ljubljana", aspect: 1.5 },
  { src: "/images/predavanja-galerija-3.webp", alt: "Samo Jeranko na tekmovanju", aspect: 1.5 },
  { src: "/images/predavanja-galerija-4.webp", alt: "Delavnica z ekipo", aspect: 1.5 },
];

const faqs = [
  {
    q: "Koliko traja predavanje?",
    a: "Od 45 minut (keynote) do 3 ure (delavnica z dihalnimi vajami). Prilagodimo vašim potrebam in urniku dogodka.",
  },
  {
    q: "Za koliko ljudi je primerno?",
    a: "Od manjše ekipe (10 oseb) do velikih dogodkov (500+). Samo je nastopil pred polno Gallusovo dvorano na TEDx Ljubljana.",
  },
  {
    q: "V katerem jeziku poteka?",
    a: "Slovensko ali angleško. Samo govori oba jezika tekoče.",
  },
  {
    q: "Koliko stane?",
    a: "Cena je odvisna od formata, trajanja in lokacije. Kontaktirajte nas za ponudbo.",
  },
  {
    q: "Ali vključuje praktične vaje?",
    a: "Da. Pri delavnicah Samo vodi udeležence skozi dihalne tehnike, ki jih lahko uporabijo takoj. Keynote je bolj osredotočen na zgodbo in navdih.",
  },
];

export default function PredavanjaPage() {
  return (
    <>
      {/* ============================================
          HERO — TEDx stage photo, dark, dramatic
          ============================================ */}
      <section className="relative w-full min-h-[560px] md:min-h-[640px] flex items-center bg-navy-dark">
        <Image
          src="/images/predavanja-hero.webp"
          alt="Samo Jeranko na TEDx Ljubljana"
          fill
          className="object-cover opacity-50"
          style={{ objectPosition: "center 25%" }}
          priority
        />
        <div className="relative w-full max-w-6xl px-6 mx-auto py-20">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
              TEDx govornik · 7 medalj s svetovnih prvenstev
            </p>
            <h1 className="text-[40px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.02em] text-white font-heading mb-6">
              Samo Jeranko
            </h1>
            <p className="text-[18px] md:text-[22px] text-white/70 leading-[1.5] font-body mb-10">
              Predavanja in delavnice o dihanju, stresu in pripravljenosti na
              zahtevne trenutke, za podjetja, ekipe in dogodke.
            </p>
            <Button asChild>
              <a href="#kontakt">Povpraševanje →</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          WHAT YOUR AUDIENCE GETS — outcomes, not topics
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Overline>Kaj pridobi vaša ekipa</Overline>
          <SectionHeading className="mb-6 max-w-2xl">
            Ne le predavanje, ampak orodje, ki ga odnesejo s seboj
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-16 max-w-2xl">
            Samo ne govori iz teorije. Govori iz izkušnje globokih potopov, kjer
            je vsak dih del priprave, in iz tekmovanj, kjer je pritisk resničen.
            Udeleženci odidejo z dihalnimi tehnikami, ki jih lahko uporabijo
            pred naslednjim sestankom, nastopom ali tekmo.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Keynote */}
            <div className="border-t-2 border-gold pt-8">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                Format 1
              </p>
              <h3 className="text-[24px] font-semibold mb-4">Keynote</h3>
              <p className="text-[15px] text-muted-text font-body mb-4">
                45–60 minut · za večje dogodke in konference
              </p>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                Navdihujoča zgodba iz sveta prostega potapljanja, prepletena z
                univerzalnimi lekcijami o pripravljenosti, dihanju in delovanju
                pod pritiskom. Primerno za 50–500+ udeležencev.
              </p>
              <p className="text-[15px] text-navy font-medium font-body">
                Vaša ekipa bo razumela, kako upravljati stres v kritičnih
                trenutkih, in dobila konkreten pristop, ki ga lahko uporabi.
              </p>
            </div>

            {/* Workshop */}
            <div className="border-t-2 border-gold pt-8">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                Format 2
              </p>
              <h3 className="text-[24px] font-semibold mb-4">
                Delavnica z dihalnimi vajami
              </h3>
              <p className="text-[15px] text-muted-text font-body mb-4">
                2–3 ure · za manjše ekipe in team building
              </p>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                Kombinacija predavanja in praktičnih dihalnih vaj. Udeleženci
                sami izkusijo, kako dihanje vpliva na telo in um, ter se
                naučijo tehnik, ki jih lahko uporabijo takoj.
              </p>
              <p className="text-[15px] text-navy font-medium font-body">
                Idealno za team building, ki ni le zabava, ampak dejansko
                izboljša delovanje ekipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          EVENT GALLERY + past engagements
          ============================================ */}
      <section className="bg-surface py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <Overline>Pretekli nastopi</Overline>
          <SectionHeading className="mb-4">
            Kje je Samo že nastopil
          </SectionHeading>
        </div>

        <PhotoGallery photos={eventPhotos} />

        <div className="max-w-6xl mx-auto px-6 mt-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-4">
            {[
              { event: "TEDx Ljubljana 2025", venue: "Cankarjev dom, Gallusova dvorana" },
              { event: "BTC City", venue: "Korporativni dogodki (večletno)" },
              { event: "ELES Slovenija", venue: "Delavnice za zaposlene" },
              { event: "Fakulteta za strojništvo, UL", venue: "Pozdrav brucev (dvakrat)" },
              { event: "HK Jesenice", venue: "Trening hokejske ekipe" },
              { event: "Trening z vrhunskim kolesarjem", venue: "Roglič / Pogačar" },
            ].map((item) => (
              <div key={item.event} className="py-2">
                <p className="text-[15px] font-medium text-navy font-body">
                  {item.event}
                </p>
                <p className="text-sm text-muted-text font-body">
                  {item.venue}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TOPICS — what he speaks about
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Overline>Teme</Overline>
          <SectionHeading className="mb-14 max-w-2xl">
            O čem govori Samo
          </SectionHeading>

          <div className="space-y-12 max-w-3xl">
            {[
              {
                title: "Moč dihanja v zahtevnih trenutkih",
                text: "Kako dihalne tehnike iz prostega potapljanja pomagajo pri obvladovanju stresa, osredotočenosti in odločanju pod pritiskom. Od tekmovanj na 100 m globine do poslovnih pogajanj je osnovni mehanizem zelo podoben.",
              },
              {
                title: "Priprava na vrhunski trenutek",
                text: "Od svetovnih prvenstev do poslovnih predstavitev: kako se pripraviti na trenutek, ko morate podati najboljše. Mentalna priprava, vizualizacija in sproščanje, ki ga Samo uporablja pred vsakim tekmovalnim potopom.",
              },
              {
                title: "Mirnost pod pritiskom",
                text: "Kaj nas potapljanje na 100+ metrov globine nauči o zbranosti, strahu in odločitvah pod pritiskom. Kako prepoznati razliko med resnično mejo in trenutkom, ko potrebujemo boljšo pripravo.",
              },
            ].map((topic, i) => (
              <div key={topic.title} className="flex gap-6 items-start">
                <span className="text-[48px] font-bold text-gold/20 font-heading leading-none shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-[20px] font-semibold mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-[16px] text-body leading-[1.7] font-body">
                    {topic.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-[15px] text-muted-text font-body max-w-3xl">
            Vsako predavanje je prilagojeno vaši ekipi in dogodku. Samo se pred
            nastopom pogovori z organizatorjem, da razume kontekst in cilje.
          </p>
        </div>
      </section>

      {/* ============================================
          CREDENTIALS — compact, for event organizers
          ============================================ */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {[
              { number: "TEDx", label: "govornik" },
              { number: "7x", label: "medalja na SP" },
              { number: "2000+", label: "ljudi poučil" },
              { number: "8 min", label: "statična apneja" },
              { number: "-110m", label: "osebni rekord" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[24px] md:text-[28px] font-bold text-gold font-heading">
                  {stat.number}
                </p>
                <p className="text-xs text-white/50 font-body mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CONTACT CTA — book Samo
          ============================================ */}
      <section className="py-20 md:py-28" id="kontakt">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <SectionHeading className="mb-6">
                Povabite Sama na vaš dogodek
              </SectionHeading>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                Izpolnite obrazec s podrobnostmi o vašem dogodku in pripravili
                vam bomo ponudbo. Samo se pred vsakim nastopom osebno pogovori
                z organizatorjem.
              </p>
              <SpeakingInquiryForm />
              <p className="mt-5 text-sm text-muted-text font-body">
                Ali pokličite{" "}
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </p>
            </div>

            <div className="relative aspect-[3/4] hidden md:block">
              <Image
                src="/images/predavanja-povabite-sama.webp"
                alt="Samo Jeranko na TEDx Ljubljana"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <FAQ items={faqs} overline="Praktično" heading="Pogosta vprašanja" />
    </>
  );
}
