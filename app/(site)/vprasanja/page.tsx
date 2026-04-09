import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { FAQ } from "@/components/blocks/FAQ";
import { FinalCTA } from "@/components/blocks/FinalCTA";

export const metadata = {
  title: "Pogosta vprašanja",
  description:
    "Odgovori na pogosta vprašanja o tečajih prostega potapljanja, treningih, darilnih bonih in opremi. Apnea Slovenija.",
};

const courseFaqs = [
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
];

const trainingFaqs = [
  { q: "Kako se prijavim na treninge?", a: "Preko prijavnega obrazca na strani treningov. Izberete lokacijo, termin in nivo." },
  { q: "Koliko stane članarina?", a: "Letna članarina v ŠD Apnea Slovenija: €35 (oktober–oktober). Vadnina: €54–62/mesec, odvisno od lokacije." },
  { q: "Kdo vodi treninge?", a: "Trenerji plavanja in inštruktorji prostega potapljanja. Program zasnuje Samo Jeranko." },
  { q: "Koliko udeležencev je v skupini?", a: "7–8 na progo, a v praksi povprečno manj kot 5 — kar je optimalno." },
  { q: "Ali potrebujem predhodno izkušnjo?", a: "Za začetno skupino ne. Za nadaljevalno in performance skupino morate obvladati osnove plavanja." },
  { q: "Ali je tečaj pogoj za treninge?", a: "Ne — na treninge se lahko prijavite brez predhodnega tečaja." },
  { q: "Ali lahko menjam skupino sredi sezone?", a: "Da — če ugotovite, da je vaš nivo previsok ali prenizek." },
  { q: "Kako lahko odpovedm treninge?", a: "Odpoved je mogoča do 8. tedna programa. Po tem drugega obroka ni mogoče vrniti." },
];

const generalFaqs = [
  { q: "Kako naročim darilni bon?", a: "Preko strani Darilni bon. Izberete tečaj, plačate in prejmete digitalni bon po e-pošti. Bon velja 1 leto." },
  { q: "Imam darilni bon — kako se prijavim?", a: "Čim prej pišite na info@apnea.si z želenim terminom tečaja, da si zagotovite mesto." },
  { q: "Koliko časa velja darilni bon?", a: "1 leto od izdaje, ali dlje po dogovoru." },
  { q: "Imate še vprašanja?", a: "Pišite nam na info@apnea.si ali uporabite kontaktni obrazec na strani Kontakt." },
];

export default function VprasanjaPage() {
  return (
    <>
      <Section>
        <div className="max-w-2xl">
          <Overline>Pogosta vprašanja</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-6">
            Vse, kar morate vedeti
          </h1>
          <p className="text-[17px] text-body leading-[1.6] font-body">
            Odgovori na najpogostejša vprašanja o tečajih, treningih in
            darilnih bonih. Če ne najdete odgovora, nam pišite.
          </p>
        </div>
      </Section>

      <FAQ items={courseFaqs} overline="Tečaji" heading="Vprašanja o tečajih" />
      <FAQ items={trainingFaqs} overline="Treningi" heading="Vprašanja o treningih" />
      <FAQ items={generalFaqs} overline="Splošno" heading="Darilni boni in ostalo" />

      <FinalCTA
        heading="Niste našli odgovora?"
        description="Pišite nam — z veseljem odgovorimo na vsako vprašanje."
        buttonText="Kontaktirajte nas →"
        buttonHref="/kontakt"
      />
    </>
  );
}
