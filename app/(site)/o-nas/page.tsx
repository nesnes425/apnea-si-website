import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";

export const metadata = {
  title: "O nas",
  description:
    "Apnea Slovenija — največja šola prostega potapljanja v Sloveniji. Od enega potapljača do skupnosti 350+ ljudi. Zgodba Sama Jeranka in ljudi, ki jih je navdihnil.",
};

// === Community stories ===

const communityStories = [
  {
    name: "Polona",
    role: "Trenerka in tekmovalka",
    years: "8 let z nami",
    image: "/images/placeholder/tecaj-skupina.jpg",
    story:
      "Prišla je kot navdušenka, ki je želela poskusiti potapljanje v bazenu. Danes plava 150 metrov pod vodo brez plavuti — blizu svetovnega razreda. Postala je trenerka, ki vodi skupine v bazenu, pomaga pri organizaciji kluba in je prisotna na vsakem tekmovanju. Polona je duša Apnea Slovenije.",
  },
  {
    name: "Matevž",
    role: "Inštruktor",
    years: "Več let z nami",
    image: "/images/placeholder/tecaj-bazen-samo.png",
    story:
      "Začel je v bazenu kot vsi. Potem je opravil inštruktorski tečaj in danes pomaga voditi tečaje prostega potapljanja. Odličen je v morju — potaplja se na zavidljive globine. Prisoten na vsakem tečaju in vsakem potapljaškem kampu.",
  },
  {
    name: "Simon",
    role: "Inštruktor, z nami od začetka",
    years: "12+ let z nami",
    image: "/images/placeholder/trening-camp.jpg",
    story:
      "Simon je eden redkih, ki so bili tu od prve sezone. Že 12 let trenira, se razvija in pomaga. Postal je inštruktor in danes soustvarja tečaje skupaj s Samom. Njegova stalnost je temelj, na katerem stoji šola.",
  },
];

// === Page ===

export default function ONasPage() {
  return (
    <>
      {/* ============================================
          SECTION 1: OPENING — editorial, not template
          ============================================ */}
      <section className="relative w-full min-h-[500px] md:min-h-[600px] flex items-end">
        <Image
          src="/images/placeholder/tecaj-skupina.jpg"
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
                nenehno padal v vodo — v morje, v bazene, v potoke. Treniral je
                plavanje, a na koncu vsakega treninga je hotel le eno: plavati
                pod vodo. Čim dlje, čim globlje.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                Odkril je prosto potapljanje in hitro ugotovil, da je to
                več kot šport — je način razumevanja sebe. Študiral je
                strojništvo, a morje ga je vleklo nazaj. Leta 2008 je prvič
                tekmoval. Kmalu so prišle medalje — 10 na svetovnih prvenstvih,
                2 svetovna rekorda, 19 državnih rekordov.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                A Samo ni hotel biti le tekmovalec. Hotel je učiti. Hotel je
                tisto, kar je sam občutil na globini — tišino, zaupanje v
                lastno telo, preseganje strahu — deliti z drugimi. In tako se
                je leta 2010 rodila Apnea Slovenija.
              </p>

              <p className="text-[17px] text-body leading-[1.7] font-body">
                Na začetku jih je bilo 10 v enem bazenu v Ljubljani. Danes jih
                je več kot 350 vsak teden, na 7 lokacijah po Sloveniji. In
                Samo? Še vedno tekmuje. Še vedno poučuje. In preko{" "}
                <a
                  href="https://freedive-training.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Freedive Training
                </a>{" "}
                zdaj usmerja tudi vrhunske potapljače po svetu — nekateri med
                njimi so postali svetovni prvaki in rekorderji.
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative aspect-[3/4]">
                <Image
                  src="/images/placeholder/samo-portrait.jpg"
                  alt="Samo Jeranko"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: "10x", label: "medalja na SP" },
                  { number: "2", label: "svetovna rekorda" },
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
              { number: "350+", label: "ljudi trenira vsak teden" },
              { number: "2000+", label: "potapljačev naučenih" },
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
              Apnea Slovenija bi bila še večja, a v ljubljanskih bazenih
              preprosto ni več prostih prog. Povpraševanje vsako leto presega
              kapacitete — to je šola, ki ni rasla z oglaševanjem, ampak z
              ljudmi, ki so povedali naprej.
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
            Prišli so na tečaj. Ostali so za vedno.
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-16 max-w-2xl">
            Ko se pridružiš Apnea Sloveniji, ne vpišeš se le na trening. Postaneš
            del skupnosti, ki raste skupaj — od prvega zadrževanja diha do
            državnih prvenstev, od navdušenca do inštruktorja.
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

          {/* More community mentions */}
          <div className="mt-20 border-t border-border-custom pt-12">
            <h3 className="text-[22px] font-semibold mb-6">
              In še toliko drugih zgodb
            </h3>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-4 max-w-4xl">
              {[
                {
                  name: "Luca",
                  note: "Nekoč je učil Sama. Danes ga Samo trenira — in mu pomaga do prebojev, o katerih nista sanjala.",
                },
                {
                  name: "Japec",
                  note: "Star 70 let. Samov nekdanji šef. Še vedno se potaplja v morju. Dokazuje, da za prosto potapljanje ni starostne meje.",
                },
                {
                  name: "Naše inštruktorice",
                  note: "Več žensk, ki so začele kot navdušenke in danes vodijo tečaje — trenerke, ki so sčasoma postale srce skupnosti.",
                },
                {
                  name: "Skupina, ki trenira skupaj že 8 let",
                  note: "Ista ura, isti bazen, isti ljudje. Niso več le sotreniranke — postali so prijatelji.",
                },
              ].map((item) => (
                <div key={item.name} className="py-3">
                  <p className="text-[15px] font-body">
                    <strong className="text-navy">{item.name}:</strong>{" "}
                    <span className="text-body">{item.note}</span>
                  </p>
                </div>
              ))}
            </div>
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
                Vsako leto se naši člani udeležijo državnih prvenstev —
                in vsako leto se vrnejo z medaljami in rekordi. To niso
                profesionalci. To so ljudje, ki so začeli pri nas, trenirali
                leto za letom in prerasli v tekmovalce.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: "15+", label: "medalj na SP (Samovi športniki)" },
                  { number: "46", label: "državnih rekordov" },
                  { number: "6", label: "svetovnih rekordov (športniki)" },
                  { number: "Vsako leto", label: "na državnem prvenstvu" },
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
                src="/images/placeholder/samo-cmas-2025.png"
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
            {["Mares", "SSI", "BTC City", "ELES", "Highfield Boats", "TEDx Ljubljana"].map(
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
            Pridružite se nam
          </h2>
          <p className="text-[18px] text-white/60 font-body mb-10 max-w-2xl mx-auto">
            Začnite s tečajem ali se vpišite na treninge. Ne glede na to, kje
            začnete — postanete del zgodbe, ki raste že 15 let.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/tecaji"
              className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
            >
              Tečaji →
            </a>
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
