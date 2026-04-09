import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Pogosta vprašanja",
  description:
    "Odgovori na pogosta vprašanja o tečajih prostega potapljanja, treningih, darilnih bonih in opremi. Apnea Slovenija.",
};

const sections = [
  {
    id: "tecaji",
    title: "Tečaji",
    description: "Prijava, oprema, potek, odpoved",
    faqs: [
      { q: "Kako se prijavim na tečaj?", a: "Izberete termin na strani tečaja in kliknete 'Rezerviraj'. Po plačilu prejmete potrditveni e-mail z vsemi podrobnostmi." },
      { q: "Ali potrebujem zdravniško potrdilo?", a: "Pred tečajem izpolnite zdravstveno izjavo. Zdravniško potrdilo je potrebno le v primeru kroničnih bolezni (sladkorna bolezen, hipertenzija, srčne težave, težave z ušesi)." },
      { q: "Kakšno opremo potrebujem?", a: "Masko, plavuti, utežni pas in obleko (neopren 5mm). Vso opremo si lahko izposodite pri naši partnerski trgovini Aquamanija za €40 (brezplačno ob nakupu katerega koli kosa)." },
      { q: "Kakšen certifikat prejmem?", a: "SSI Freediving certifikat ustreznega nivoja (Level 1, 2 ali 3). SSI je mednarodno priznana certifikacija." },
      { q: "Kako poteka teorija?", a: "Predavanja v učilnici z gradivi, videi in vajami na suhem. Trajanje se razlikuje glede na nivo tečaja." },
      { q: "Kako poteka bazen?", a: "Sprostitev, dihanje, raztezanje, statična apneja, dinamična apneja in osnove izenačevanja. Vse pod nadzorom inštruktorja." },
      { q: "Kako poteka morje?", a: "Vikend program: dihalne/raztezne vaje in tri serije globinskih potopov. Napredni tečaji trajajo 3–5 dni." },
      { q: "Ali je nastanitev vključena?", a: "Ne — nastanitev za globinski del (običajno na Hrvaškem) si uredite sami. Pomagamo z nasveti. Okvirni strošek: €40–60 na osebo za vikend." },
      { q: "Kaj se zgodi, če zbolim?", a: "Prijava se prenese na drug termin. Odpoved 10+ delovnih dni vnaprej: vračilo celotnega zneska minus €50 varščine." },
      { q: "Sem že potapljal/a globlje kot 20m — kateri tečaj je pravi zame?", a: "Začnite z začetnim tečajem — naučimo vas pravilne tehnike, ki je morda še ne obvladate. Če je vaša kondicija odlična, napredujete na večje globine že na tečaju." },
      { q: "Ali udeleženci tečaja prejmejo popuste?", a: "Da — popusti veljajo pri trgovinah Aquamanija, Extremo, Aquas, Norik Sub in Scubatom." },
    ],
  },
  {
    id: "treningi",
    title: "Treningi",
    description: "Prijava, cena, skupinski programi",
    faqs: [
      { q: "Kako se prijavim na treninge?", a: "Preko prijavnega obrazca na strani treningov. Izberete lokacijo, termin in nivo." },
      { q: "Koliko stane?", a: "Letna članarina: €35 (ŠD Apnea Slovenija). Vadnina: €54–62/mesec, odvisno od lokacije. Plačilo v dveh obrokih (60% + 40%)." },
      { q: "Kdo vodi treninge?", a: "Trenerji plavanja in inštruktorji prostega potapljanja. Program zasnuje Samo Jeranko." },
      { q: "Koliko udeležencev je v skupini?", a: "7–8 na progo, a v praksi povprečno manj kot 5 — kar je optimalno." },
      { q: "Ali potrebujem predhodno izkušnjo?", a: "Za začetno skupino ne. Za nadaljevalno in performance skupino morate obvladati osnove plavanja." },
      { q: "Ali je tečaj pogoj za treninge?", a: "Ne — na treninge se lahko prijavite brez predhodnega tečaja." },
      { q: "Ali lahko menjam skupino sredi sezone?", a: "Da — če ugotovite, da je vaš nivo previsok ali prenizek." },
      { q: "Kako lahko odpovedm treninge?", a: "Odpoved je mogoča do 8. tedna programa. Po tem drugega obroka ni mogoče vrniti." },
    ],
  },
  {
    id: "darilni-boni",
    title: "Darilni boni",
    description: "Nakup, veljavnost, uporaba",
    faqs: [
      { q: "Kako naročim darilni bon?", a: "Preko strani Darilni bon. Izberete tečaj, plačate in prejmete digitalni bon po e-pošti. Bon velja 1 leto." },
      { q: "Imam darilni bon — kako se prijavim?", a: "Čim prej pišite na info@apnea.si z želenim terminom tečaja, da si zagotovite mesto." },
      { q: "Koliko časa velja darilni bon?", a: "1 leto od izdaje, ali dlje po dogovoru." },
    ],
  },
];

export default function VprasanjaPage() {
  return (
    <>
      {/* Header with section navigation */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-[36px] md:text-[48px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-4">
            Pogosta vprašanja
          </h1>
          <p className="text-[17px] text-body leading-[1.6] font-body mb-10">
            Odgovori na najpogostejša vprašanja o tečajih, treningih in
            darilnih bonih. Če ne najdete odgovora,{" "}
            <Link
              href="/kontakt"
              className="text-gold hover:text-gold-hover transition-colors"
            >
              nam pišite
            </Link>
            .
          </p>

          {/* Jump links */}
          <div className="flex flex-wrap gap-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="border border-border-custom px-4 py-2 text-[14px] font-medium text-navy font-body hover:border-gold hover:text-gold transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          className={sectionIndex % 2 === 1 ? "bg-surface py-16 md:py-20" : "py-16 md:py-20"}
        >
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className="text-[24px] md:text-[28px] font-semibold">
                {section.title}
              </h2>
              <span className="text-sm text-muted-text font-body">
                {section.description}
              </span>
            </div>

            <div>
              {section.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-border-custom"
                >
                  <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
                    <span className="text-[16px] font-medium text-navy font-body pr-8">
                      {faq.q}
                    </span>
                    <span className="text-gold text-xl shrink-0 group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-[15px] text-body leading-[1.7] font-body">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Still have questions */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[24px] md:text-[28px] font-semibold mb-4">
            Niste našli odgovora?
          </h2>
          <p className="text-[17px] text-body font-body mb-8">
            Pišite nam na{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-gold hover:text-gold-hover transition-colors"
            >
              {siteConfig.email}
            </a>{" "}
            ali pokličite{" "}
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="text-gold hover:text-gold-hover transition-colors"
            >
              {siteConfig.phone}
            </a>
            .
          </p>
          <Link
            href="/kontakt"
            className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
          >
            Kontaktni obrazec →
          </Link>
        </div>
      </section>
    </>
  );
}
