import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";

export const metadata = {
  title: "Predavanja za podjetja",
  description:
    "Samo Jeranko — TEDx govornik, 10x svetovni prvak. Predavanja o dihanju, stresu in vrhunski pripravljenosti. Za podjetja, ekipe in dogodke.",
};

const topics = [
  {
    title: "Moč dihanja v zahtevnih trenutkih",
    description:
      "Kako dihalne tehnike iz prostega potapljanja pomagajo pri obvladovanju stresa, osredotočenosti in odločanju pod pritiskom. Praktične vaje, ki jih udeleženci odnesejo s seboj.",
  },
  {
    title: "Priprava na vrhunski trenutek",
    description:
      "Od svetovnih prvenstev do poslovnih predstavitev — kako se pripraviti na trenutek, ko morate podati najboljše. Mentalna priprava, vizualizacija in tehnika sproščanja.",
  },
  {
    title: "Preseganje lastnih meja",
    description:
      "Kaj nas potapljanje na 100+ metrov globine nauči o naših zmožnostih. Kako prepoznati razliko med strahom in dejansko mejo — in kako jo varno premakniti.",
  },
];

const pastSpeaking = [
  "TEDx Ljubljana 2025 — Cankarjev dom, Gallusova dvorana",
  "BTC City — korporativni dogodki (večletno sodelovanje)",
  "ELES Slovenija — delavnice za zaposlene",
  "Fakulteta za strojništvo, UL — pozdrav brucev (dvakrat)",
  "Trening hokejske ekipe Jesenice",
  "Trening z vrhunskim kolesarjem (Roglič / Pogačar)",
];

const faqs = [
  {
    q: "Koliko traja predavanje?",
    a: "Od 45 minut (keynote) do 3 ure (delavnica z dihalnimi vajami). Prilagodimo vašim potrebam.",
  },
  {
    q: "Ali vključuje praktične vaje?",
    a: "Da — Samo vodi udeležence skozi dihalne tehnike, ki jih lahko uporabijo takoj. To ni le predavanje, ampak izkušnja.",
  },
  {
    q: "Za koliko ljudi je primerno?",
    a: "Od manjše ekipe (10 oseb) do velikih dogodkov (500+). Samo je nastopil pred polno Gallusovo dvorano na TEDx Ljubljana.",
  },
  {
    q: "V katerem jeziku poteka?",
    a: "Slovensko ali angleško — Samo govori oba jezika tekoče.",
  },
  {
    q: "Koliko stane?",
    a: "Cena je odvisna od formata, trajanja in lokacije. Kontaktirajte nas za ponudbo.",
  },
];

export default function PredavanjaPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full min-h-[480px] md:min-h-[560px] flex items-center">
        <Image
          src="/images/placeholder/samo-cmas-2025.png"
          alt="Samo Jeranko"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
        <div className="absolute inset-0 bg-white/60 md:hidden" />

        <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
          <div className="max-w-lg">
            <Overline>Predavanja za podjetja</Overline>
            <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
              Dihanje, stres in vrhunska pripravljenost
            </h1>
            <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-8">
              Samo Jeranko — 10-kratni svetovni prvak, TEDx govornik in
              inštruktor, ki svoje znanje prenaša na ekipe, podjetnike in
              organizacije.
            </p>
            <a
              href="#kontakt"
              className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
            >
              Povpraševanje →
            </a>
          </div>
        </div>
      </section>

      {/* Credentials bar */}
      <section className="bg-surface">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { number: "10x", label: "medalja na SP" },
            { number: "TEDx", label: "govornik" },
            { number: "2000+", label: "potapljačev poučil" },
            { number: "15+", label: "let izkušenj" },
          ].map((stat) => (
            <div key={stat.label} className="py-6 md:py-8 px-6 text-center">
              <p className="text-[24px] md:text-[28px] font-bold text-gold font-heading">
                {stat.number}
              </p>
              <p className="text-xs md:text-sm text-muted-text font-body mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Topics */}
      <Section>
        <Overline>Teme predavanj</Overline>
        <SectionHeading className="mb-14 max-w-2xl">
          O čem govori Samo
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8">
          {topics.map((topic) => (
            <div key={topic.title} className="border-t-2 border-gold pt-6">
              <h3 className="text-[20px] font-semibold mb-3">{topic.title}</h3>
              <p className="text-[16px] text-body leading-[1.7] font-body">
                {topic.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Past speaking */}
      <Section surface>
        <Overline>Pretekla predavanja</Overline>
        <SectionHeading className="mb-10 max-w-2xl">
          Kje je Samo že nastopil
        </SectionHeading>

        <div className="max-w-2xl">
          <CheckList items={pastSpeaking} />
        </div>
      </Section>

      {/* Why Samo */}
      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Overline>Zakaj Samo</Overline>
            <SectionHeading className="mb-6">
              Ne le predavatelj — izkušnja
            </SectionHeading>
            <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
              Samo ne govori iz teorije. Govori iz izkušnje — iz globin, kjer
              je vsak dih odločitev, iz tekmovanj, kjer je pritisk resnični, in
              iz 15 let poučevanja ljudi, kako obvladati sebe v zahtevnih
              trenutkih.
            </p>
            <p className="text-[17px] text-body leading-[1.7] font-body">
              Njegova predavanja niso le zanimiva — so uporabna. Udeleženci
              odidejo z dihalnimi tehnikami, ki jih lahko uporabijo takoj —
              pred naslednjim sestankom, nastopom ali tekmo.
            </p>
          </div>
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/placeholder/samo-portrait.jpg"
              alt="Samo Jeranko med predavanjem"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <FAQ items={faqs} overline="Praktično" heading="Pogosta vprašanja" />

      {/* Contact CTA */}
      <Section surface id="kontakt">
        <div className="max-w-2xl mx-auto text-center">
          <SectionHeading center className="mb-6">
            Povabite Sama na vaš dogodek
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            Pišite nam s podrobnostmi o vašem dogodku — datum, format, število
            udeležencev — in pripravili vam bomo ponudbo.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Povpraševanje za predavanje`}
            className="bg-gold text-white px-10 py-4 text-[16px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
          >
            {siteConfig.email}
          </a>
        </div>
      </Section>
    </>
  );
}
