import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { LocalBusinessJsonLd, PersonSamoJsonLd } from "@/components/seo/StructuredData";

export const metadata = {
  title: "O nas",
  description:
    "Apnea Slovenija je največja šola prostega potapljanja v Sloveniji. Od enega potapljača do skupnosti 350+ ljudi. Zgodba Sama Jeranka in ljudi, ki se potapljajo z njim.",
};

// === Community stories ===

const communityStories = [
  {
    name: "Polona",
    role: "Trenerka in tekmovalka",
    years: "8 let z nami",
    image: "/images/onas-polona.webp",
    story:
      "Prišla je kot navdušenka, ki je želela poskusiti potapljanje v bazenu. Danes plava 150 metrov pod vodo brez plavuti in je ena tistih ljudi, ki najbolje pokažejo, kam lahko pripelje redna vadba. Postala je trenerka, ki vodi skupine v bazenu, pomaga pri organizaciji kluba in je prisotna na tekmovanjih.",
  },
  {
    name: "Matevž",
    role: "Inštruktor",
    years: "6 let z nami",
    image: "/images/onas-matevz.webp",
    story:
      "Začel je v bazenu, potem opravil inštruktorski tečaj in danes pomaga voditi tečaje. Srečate ga lahko tako na bazenu kot na našem vsakoletnem trening kampu. Brez Matevža Samovi tečaji ne bi potekali tako mirno in gladko.",
  },
  {
    name: "Simon",
    role: "Inštruktor, z nami od samega začetka",
    years: "12+ let z nami",
    image: "/images/onas-simon.webp",
    story:
      "Simon je eden tistih, ki so bili tu že od prvih sezon. Že več kot 12 let trenira, napreduje in pomaga drugim. Postal je inštruktor in danes soustvarja tečaje skupaj s Samom.",
  },
];

// === Page ===

export default function ONasPage() {
  return (
    <>
      <LocalBusinessJsonLd />
      <PersonSamoJsonLd />
      {/* ============================================
          SECTION 1: OPENING — editorial, not template
          ============================================ */}
      <section className="relative w-full min-h-[500px] md:min-h-[600px] flex items-end">
        <Image
          src="/images/onas-hero.webp"
          alt="Skupnost Apnea Slovenija"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
        <div className="relative w-full max-w-6xl px-6 mx-auto pb-16 md:pb-20">
          <p className="text-[56px] md:text-[72px] font-bold leading-[1.05] tracking-[-0.03em] text-white font-heading max-w-3xl">
            Od enega potapljača do največje šole v Sloveniji
          </p>
        </div>
      </section>

      {/* ============================================
          SECTION 2: SAMO'S STORY — editorial text
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[1fr_380px] gap-16 items-start">
            <div>
              <p className="text-[20px] md:text-[22px] text-navy leading-[1.6] font-body mb-8">
                Sama Jeranka je voda privlačila, odkar pomni. Kot otrok je
                nenehno iskal priložnost, da skoči v morje, bazen ali jezero.
                Treniral je plavanje, a na koncu vsakega treninga si je želel
                še vsaj enkrat zaplavati pod vodo. Čim dlje.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                Kasneje je odkril prosto potapljanje in podvodni ribolov in se
                v oba takoj zaljubil. Študiral je strojništvo, a morje ga je
                neprestano vleklo k sebi. Leta 2008 je prvič tekmoval in hitro
                so začele prihajati medalje. Osvojil je 10 medalj na svetovnih
                prvenstvih in postavil 19 državnih rekordov.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                Potovanja na Bahame in v Egipt niso bila poceni, zato je Samo
                začel učiti prosto potapljanje in s tem financirati svoja
                tekmovanja. Tako je začel tišino, zaupanje v lastno telo in
                ljubezen do morja deliti z drugimi. Leta 2010 se je rodilo
                društvo Apnea Slovenija.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body">
                Na začetku je v bazenu Tivoli v Ljubljani treniralo 10 ljudi.
                Danes več kot 350 ljudi trenira vsak teden na več lokacijah po
                Sloveniji. Samo še vedno tekmuje in uči, prek znamke{" "}
                <a
                  href="https://freedive-training.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Freedive Training
                </a>{" "}
                pa trenira tudi druge vrhunske potapljače po svetu. Nekateri
                med njimi so dosegli rezultate v samem svetovnem vrhu.
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/images/onas-samo.webp"
                  alt="Samo Jeranko"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: "10x", label: "medalja na SP" },
                  { number: "19", label: "državnih rekordov" },
                  { number: "-110m", label: "osebni rekord" },
                  { number: "8 min", label: "statična apneja" },
                ].map((stat) => (
                  <div key={stat.label} className="border-l-2 border-gold/30 pl-3">
                    <p className="text-[20px] font-bold text-navy font-heading">
                      {stat.number}
                    </p>
                    <p className="text-xs text-muted-text font-body">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: WHAT HE BUILT — the school's scale
          ============================================ */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
            {[
              { number: "350+", label: "ljudi trenira vsak teden na bazenu" },
              { number: "2000+", label: "potapljačev na tečajih" },
              { number: "7", label: "lokacij po Sloveniji" },
              { number: "15+", label: "let delovanja" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-[36px] md:text-[48px] font-bold text-gold font-heading leading-none">
                  {stat.number}
                </p>
                <p className="text-sm text-white/60 font-body mt-2">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[18px] md:text-[20px] text-white/80 leading-[1.6] font-body">
              Povpraševanje vsako leto raste predvsem zato, ker naši člani
              pripeljejo prijatelje, znance in družinske člane.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: OUR PEOPLE — the community
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Overline>Naši ljudje</Overline>
          <SectionHeading className="mb-6 max-w-2xl">
            Prišli so na tečaj, ostali so za vedno.
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-16 max-w-2xl">
            Ko se pridružite Apnea Sloveniji, se ne vpišete le na trening
            prostega potapljanja, temveč postanete del skupnosti. Od prvega
            zadrževanja diha do državnih prvenstev in od navdušenca do
            inštruktorja, tu se zgodbe pogosto nadaljujejo več let.
          </p>

          <div className="space-y-16">
            {communityStories.map((person, i) => (
              <div
                key={person.name}
                className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${
                  i % 2 === 1 ? "md:direction-rtl" : ""
                }`}
              >
                <div className={`relative aspect-[4/3] ${i % 2 === 1 ? "md:order-2" : ""}`}>
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : ""}>
                  <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-2">
                    {person.role} · {person.years}
                  </p>
                  <h3 className="text-[28px] md:text-[32px] font-semibold leading-[1.15] mb-4">
                    {person.name}
                  </h3>
                  <p className="text-[17px] text-body leading-[1.7] font-body">
                    {person.story}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-surface px-8 py-10 md:px-12 md:py-12">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
              Skupnost
            </p>
            <h3 className="text-[26px] md:text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] mb-4 max-w-2xl">
              Zgodbe se pri nas pogosto nadaljujejo več let.
            </h3>
            <p className="text-[17px] text-body leading-[1.7] font-body max-w-3xl">
              Nekdo pride zaradi tečaja, drugi zaradi treninga, tretji zato,
              ker bi rad v morju končno naredil nekaj več kot plaval po
              gladini. Čez čas iz tega nastanejo redna vadba, prijateljstva,
              trening kampi, tekmovanja in ljudje, ki začnejo pomagati novim
              članom.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: COMPETITION RESULTS — community achievements
          ============================================ */}
      <section className="bg-surface py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Overline>Rezultati skupnosti</Overline>
              <SectionHeading className="mb-6">
                Naši ljudje na tekmovanjih
              </SectionHeading>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                Vsako leto se naši člani udeležijo državnih prvenstev in vsako
                leto se domov vrnejo z medaljami in rekordi. To niso nujno
                ljudje, ki so začeli kot profesionalci. Veliko jih je začelo
                pri nas, treniralo več let zapored in preraslo v tekmovalce.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: "15+", label: "medalj na SP (Samovi športniki)" },
                  { number: "46", label: "državnih rekordov" },
                  { number: "6", label: "svetovnih rekordov (športniki)" },
                  { number: "20+", label: "medalj na državnih prvenstvih" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[24px] font-bold text-gold font-heading">
                      {stat.number}
                    </p>
                    <p className="text-sm text-muted-text font-body">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/3]">
              <Image
                src="/images/onas-tekmovanje.webp"
                alt="Tekmovanje prostega potapljanja"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: PARTNERS — logos only
          ============================================ */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-12 items-center">
            {["Mares", "SSI", "BTC City", "ELES", "Highfield Boats"].map(
              (partner) => (
                <span
                  key={partner}
                  className="text-[15px] text-navy/30 font-medium font-body"
                >
                  {partner}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: CTA — warm, inviting
          ============================================ */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[32px] md:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6 font-heading">
            Pridruži se nam
          </h2>
          <p className="text-[18px] text-white/60 font-body mb-10 max-w-2xl mx-auto">
            Začnite s tečajem ali se vpišite na treninge. Ne glede na to, kje
            začnete, postanete del zgodbe, ki raste že več kot 15 let.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <a href="/tecaji">Tečaji →</a>
            </Button>
            <a
              href="/treningi"
              className="border-2 border-white/30 text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:border-white/60 transition-colors inline-block"
            >
              Treningi →
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
