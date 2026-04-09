import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";
import { FinalCTA } from "@/components/blocks/FinalCTA";

export const metadata = {
  title: "Treningi prostega potapljanja",
  description:
    "Celoletni vodeni treningi prostega potapljanja na 5+ lokacijah po Sloveniji. 4 programi od začetnikov do tekmovalcev. €54–62/mesec.",
};

const programs = [
  {
    title: "Začetni program",
    who: "Vsi, ki na novo vstopate v svet plavanja ali prostega potapljanja",
    what: "Tehnika plavanja (kraul, prsno, delfin), osnove zadrževanja diha, varne progresije pod vodo",
    prereq: "Brez predhodnih izkušenj",
  },
  {
    title: "Nadaljevalni program",
    who: "Plavalci z ustrezno tehniko, ki želijo intenzivnejši trening",
    what: "Aerobni in anaerobni trening, CO₂/O₂ tolerance, sistematična periodizacija",
    prereq: "Obvladanje osnovnih plavalnih tehnik",
  },
  {
    title: "Performance program",
    who: "Izkušeni potapljači z ambicijami za tekmovanja",
    what: "Dolgih potopi s specializiranimi plavutmi, intenzivni O₂/CO₂ seti, individualno spremljanje napredka",
    prereq: "Odlična plavalna tehnika",
  },
  {
    title: "Statična apneja",
    who: "Vsi, ki želijo izboljšati zadrževanje diha na površini",
    what: "Sprostitvene tehnike, prilagajanje na CO₂, progresivni protokoli zadrževanja diha",
    prereq: "Brez predpogojev",
  },
];

const locations = [
  { city: "Ljubljana", venues: "Fakulteta za šport, Tivoli, Ilirija, Vevče", status: "Polno — čakalna lista" },
  { city: "Kranj", venues: "Mestni bazen", status: "Prosta mesta" },
  { city: "Nova Gorica", venues: "Mestni bazen", status: "Prosta mesta" },
  { city: "Koper", venues: "Mestni bazen", status: "Prosta mesta" },
  { city: "Novo Mesto", venues: "Mestni bazen", status: "Prosta mesta" },
  { city: "Velenje", venues: "Mestni bazen", status: "Prosta mesta" },
  { city: "Radovljica", venues: "Mestni bazen", status: "Prosta mesta" },
];

const faqs = [
  { q: "Ali potrebujem predhodni tečaj?", a: "Ne — na treninge se lahko prijavite brez predhodnega tečaja prostega potapljanja." },
  { q: "Koliko stane?", a: "Letna članarina: €35 (ŠD Apnea Slovenija). Vadnina: €54–62/mesec, odvisno od lokacije in frekvence. Plačilo v dveh obrokih (60% + 40%)." },
  { q: "Kdaj potekajo treningi?", a: "Sezona: oktober–junij. Termini: jutranji (7:00) in večerni (17:00–22:00), odvisno od lokacije." },
  { q: "Koliko krat na teden je optimalno?", a: "Dvakrat tedensko je optimalno — npr. enkrat nadaljevalni, enkrat performance program." },
  { q: "Kakšno opremo potrebujem?", a: "Kratke plavuti, dihalka, športne kopalke, kapa, očala ali maska, utežni pas za vrat. Performance skupina tudi dolge plavuti in neoprensko obleko." },
  { q: "Ali lahko odpovedm sredi sezone?", a: "Odpoved je mogoča do 8. tedna programa. Po tem drugega obroka ni mogoče vrniti." },
  { q: "Me zanima le plavanje — ali so treningi primerni?", a: "Da — treningi kombinirajo plavanje in apnejo. Začetna in nadaljevalna skupina privabljata tudi ljubitelje plavanja." },
];

export default function TreningiPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center">
        <Image
          src="/images/placeholder/trening-camp.jpg"
          alt="Trening prostega potapljanja v bazenu"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
        <div className="absolute inset-0 bg-white/60 md:hidden" />

        <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
          <div className="max-w-lg">
            <Overline>Treningi</Overline>
            <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
              Redni vodeni treningi prostega potapljanja
            </h1>
            <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
              Celoletni strukturirani programi v bazenu — od osnov plavanja do
              tekmovalnih priprav. Vsak teden, pod vodstvom izkušenih trenerjev,
              na lokacijah po celi Sloveniji.
            </p>
            <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
              od €54/mesec + €35 letna članarina
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#programi"
                className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
              >
                Programi →
              </a>
              <a
                href="#lokacije"
                className="border-2 border-navy text-navy px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy hover:text-white transition-colors inline-block"
              >
                Lokacije →
              </a>
            </div>
          </div>
        </div>
      </section>

      <SocialProofBar
        stats={[
          { number: "500+", label: "udeležencev letno" },
          { number: "7+", label: "lokacij" },
          { number: "4", label: "programi" },
          { number: "okt–jun", label: "sezona" },
        ]}
      />

      {/* Why trainings */}
      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Overline>Zakaj treningi?</Overline>
            <SectionHeading className="mb-6">
              Z enim samim tečajem ne dosežeš prave sproščenosti pod vodo
            </SectionHeading>
            <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
              Treningi so srce tvojega potapljaškega napredka. S podporo
              izkušenih trenerjev in rednimi treningi boš prešel od začetne
              negotovosti do popolnega nadzora. Namesto da se potapljaš z
              napetostjo, boš užival v vsakem trenutku pod gladino.
            </p>
            <p className="text-[17px] text-body leading-[1.7] font-body">
              Naši treningi niso le vaja dihanja in tehnike. So zaupanje, ki ga
              gradiš vase. So moč, ki jo čutiš med vsakim potopom.
            </p>
          </div>
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/placeholder/tecaj-bazen-samo.png"
              alt="Trening v bazenu"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      {/* Programs */}
      <Section surface id="programi">
        <Overline>Programi</Overline>
        <SectionHeading className="mb-6 max-w-2xl">
          Štirje programi za vsak nivo
        </SectionHeading>
        <p className="text-[17px] text-body leading-[1.7] font-body mb-14 max-w-2xl">
          Vsak program je strukturiran za drugačen nivo izkušenj. Lahko se
          odločite za enega ali kombinirate dva za hitrejši napredek.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {programs.map((program) => (
            <div
              key={program.title}
              className="border border-border-custom bg-white p-8"
            >
              <h3 className="text-[22px] font-semibold mb-4">
                {program.title}
              </h3>
              <div className="space-y-3 text-[15px] font-body">
                <div>
                  <span className="text-muted-text">Za koga: </span>
                  <span className="text-body">{program.who}</span>
                </div>
                <div>
                  <span className="text-muted-text">Vsebina: </span>
                  <span className="text-body">{program.what}</span>
                </div>
                <div>
                  <span className="text-muted-text">Predpogoj: </span>
                  <span className="text-navy font-medium">
                    {program.prereq}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Session structure */}
      <Section>
        <Overline>Kako poteka trening</Overline>
        <SectionHeading className="mb-10 max-w-2xl">
          Struktura vadbene ure
        </SectionHeading>
        <div className="max-w-2xl space-y-6">
          <div className="flex gap-5 items-start">
            <span className="text-[28px] font-bold text-gold font-heading leading-none shrink-0 w-14">
              15 min
            </span>
            <div>
              <h3 className="text-[17px] font-medium text-navy font-body mb-1">
                Ogrevanje na suhem
              </h3>
              <p className="text-[15px] text-body leading-[1.6] font-body">
                Raztezanje, dihalne vaje in priprava na vodo.
              </p>
            </div>
          </div>
          <div className="flex gap-5 items-start">
            <span className="text-[28px] font-bold text-gold font-heading leading-none shrink-0 w-14">
              60 min
            </span>
            <div>
              <h3 className="text-[17px] font-medium text-navy font-body mb-1">
                Delo v vodi
              </h3>
              <p className="text-[15px] text-body leading-[1.6] font-body">
                Plavanje, dinamična apneja, podvodno plavanje in specifični
                seti glede na program. Začetna skupina začne s plavanjem,
                performance skupina takoj z intenzivnimi potopi.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Locations */}
      <Section surface id="lokacije">
        <Overline>Lokacije in termini</Overline>
        <SectionHeading className="mb-10">
          Kje potekajo treningi
        </SectionHeading>

        <div className="divide-y divide-border-custom max-w-3xl">
          {locations.map((loc) => (
            <div
              key={loc.city}
              className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <p className="text-[17px] font-medium text-navy font-body">
                  {loc.city}
                </p>
                <p className="text-sm text-muted-text font-body">
                  {loc.venues}
                </p>
              </div>
              <span
                className={`text-sm font-medium font-body shrink-0 ${
                  loc.status.includes("Polno")
                    ? "text-muted-text"
                    : "text-gold"
                }`}
              >
                {loc.status}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-gold-pale p-8 max-w-3xl">
          <p className="text-[17px] font-medium text-navy font-body mb-2">
            Prijave za sezono 2026/27 se odprejo avgusta 2026.
          </p>
          <p className="text-[15px] text-body font-body mb-4">
            Ljubljana se zapolni najhitreje. Če želite biti obveščeni, ko se
            prijave odprejo, pustite e-mail.
          </p>
          {/* Placeholder for Brevo email capture */}
          <div className="flex gap-3 max-w-md">
            <input
              type="email"
              placeholder="vas@email.si"
              className="flex-1 border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
            />
            <button
              type="button"
              className="bg-gold text-white px-6 py-3 text-[14px] font-medium font-body hover:bg-gold-hover transition-colors shrink-0"
            >
              Obvesti me →
            </button>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section>
        <Overline>Cenik</Overline>
        <SectionHeading className="mb-10">
          Koliko stanejo treningi
        </SectionHeading>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
          <div className="border border-border-custom p-8">
            <p className="text-sm text-muted-text font-body mb-1">
              Letna članarina
            </p>
            <p className="text-[36px] font-bold text-navy font-heading leading-none mb-2">
              €{siteConfig.trainings.membership.price}
            </p>
            <p className="text-sm text-muted-text font-body">
              {siteConfig.trainings.membership.entity} · oktober–oktober
            </p>
          </div>
          <div className="border border-border-custom p-8">
            <p className="text-sm text-muted-text font-body mb-1">
              Mesečna vadnina
            </p>
            <p className="text-[36px] font-bold text-navy font-heading leading-none mb-2">
              €54–62
            </p>
            <p className="text-sm text-muted-text font-body">
              Odvisno od lokacije · plačilo v 2 obrokih
            </p>
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <CheckList
            items={[
              "Profesionalno vodstvo (program zasnuje Samo Jeranko)",
              "Majhne skupine (povprečno pod 5 na progo)",
              "Oprema ni vključena — priskrbite svojo ali izposodite",
              "Dvakrat tedensko = optimalen napredek",
            ]}
          />
        </div>
      </Section>

      <FAQ items={faqs} />

      <FinalCTA
        heading="Pridružite se 500+ potapljačem na treningih"
        description="Prijave za sezono 2026/27 se odprejo avgusta. Pustite e-mail in vas obvestimo."
        buttonText="Lokacije in programi →"
        buttonHref="#programi"
        backgroundImage="/images/placeholder/tecaj-bazen-samo.png"
      />
    </>
  );
}
