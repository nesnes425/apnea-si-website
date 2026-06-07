import Image from "next/image";
import { FAQ } from "@/components/blocks/FAQ";
import { Overline } from "@/components/blocks/Overline";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { Testimonials } from "@/components/blocks/Testimonials";
import { Button } from "@/components/ui/button";
import {
  getTrainingGroups,
  getTrainingSettings,
} from "@/lib/sanity/queries";
import { siteConfig } from "@/lib/config";
import { TrainingScheduleSelector } from "./TrainingScheduleSelector";

export const metadata = {
  title: "Treningi prostega potapljanja",
  description:
    "Celoletni vodeni treningi prostega potapljanja na 7 lokacijah po Sloveniji. Od začetnikov do tekmovalcev. Sezona oktober–junij. Pridružite se 350+ potapljačem.",
};

export const revalidate = 60;

const reviews = [
  {
    text: "Treningi so postali del mojega tedna, ki ga ne bi zamenjala za nič. Začela sem kot popolna začetnica — danes plavam pod vodo 100 metrov in hodim na državna prvenstva. Ekipa je fantastična.",
    name: "Maja L.",
    detail: "Trenira 4 leta, Ljubljana",
  },
  {
    text: "Prišel sem, ker sem hotel izboljšati potapljanje za podvodni ribolov. Ostal sem, ker so treningi postali najboljši del mojega tedna. Ista ekipa, isti bazen, vsak torek.",
    name: "Rok S.",
    detail: "Trenira 3 leta, Koper",
  },
  {
    text: "Po petih letih treningov sem postal inštruktor. Nikoli si nisem mislil, da bom poučeval — a treningi ti dajo toliko, da v nekem trenutku želiš to vrniti naprej.",
    name: "Matevž D.",
    detail: "Inštruktor, 5+ let z nami",
  },
];

const faqs = [
  { q: "Ali potrebujem predhodni tečaj?", a: "Ne — na treninge se lahko prijavite brez predhodnega tečaja prostega potapljanja." },
  { q: "Koliko stane?", a: "Letna članarina: €35 (ŠD Apnea Slovenija). Vadnina: €54–62/mesec, odvisno od lokacije. Plačilo v dveh obrokih (60% + 40%)." },
  { q: "Kdaj potekajo treningi?", a: "Sezona: oktober–junij. Termini: jutranji (7:00) in večerni (17:00–22:00), odvisno od lokacije. Podrobne ure so navedene pri vsaki lokaciji." },
  { q: "Koliko krat na teden je optimalno?", a: "Dvakrat tedensko je optimalno. Lahko kombinirate treninge na različnih lokacijah." },
  { q: "Kakšno opremo potrebujem?", a: "Kratke plavuti, dihalka, športne kopalke, kapa, očala ali maska, utežni pas za vrat. Performance skupina tudi dolge plavuti in neoprensko obleko." },
  { q: "Ali lahko odpovedm sredi sezone?", a: "Odpoved je mogoča do 8. tedna programa. Po tem drugega obroka ni mogoče vrniti." },
  { q: "Me zanima le plavanje — ali so treningi primerni?", a: "Da — treningi kombinirajo plavanje in apnejo. Začetna in nadaljevalna skupina privabljata tudi ljubitelje plavanja." },
  { q: "Kdo vodi treninge?", a: "Izkušeni trenerji plavanja in inštruktorji prostega potapljanja. Program zasnuje Samo Jeranko. V skupini je povprečno manj kot 5 udeležencev na progo." },
  { q: "Ali so tudi treningi na prostem (morje)?", a: "Da — v poletnih mesecih organiziramo odprte vode treninge in potapljaške kampe. Informacije prejmete med sezono." },
];

const trainingPhotos = [
  { src: "/images/placeholder/tecaj-bazen-samo.png", alt: "Trening v bazenu", aspect: 1.5 },
  { src: "/images/placeholder/trening-camp.jpg", alt: "Trening camp", aspect: 1.5 },
  { src: "/images/placeholder/tecaj-skupina.jpg", alt: "Skupina na treningu", aspect: 1.5 },
  { src: "/images/placeholder/tecaj-bled.png", alt: "Trening na prostem", aspect: 1.5 },
];

export default async function TreningiPage() {
  const [settings, groups] = await Promise.all([
    getTrainingSettings(),
    getTrainingGroups(),
  ]);
  const applicationsOpen = settings?.applicationsOpen ?? false;
  const membershipFee = settings?.membershipFee ?? siteConfig.trainings.membership.price;

  return (
    <>
      <section className="relative flex min-h-[520px] w-full items-center md:min-h-[600px]">
        <Image
          src="/images/placeholder/tecaj-bazen-samo.png"
          alt="Trening prostega potapljanja v bazenu"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
        <div className="absolute inset-0 bg-white/60 md:hidden" />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-lg">
            <Overline>Treningi</Overline>
            <h1 className="mb-5 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-navy md:text-[50px]">
              Skupnost, ki raste skupaj — vsak teden v bazenu
            </h1>
            <p className="mb-3 text-[17px] leading-[1.6] text-body md:text-[19px]">
              350+ potapljačev na 7 lokacijah po Sloveniji. Od prvega kraula do
              tekmovalnih priprav. Pridružite se skupnosti, kjer se treningi
              spremenijo v prijateljstva, prijateljstva pa v rezultate.
            </p>
            <p className="mb-8 text-[20px] font-semibold text-navy md:text-[22px]">
              od €54/mesec + €{membershipFee} letna članarina
            </p>
            <Button asChild>
              <a href="#prijava">Prijava na treninge →</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-gold-pale py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium text-navy">
            {applicationsOpen
              ? `Prijave za sezono ${settings?.seasonLabel ?? ""} so odprte.`
              : "Spletne prijave so trenutno zaprte. Za vključitev med sezono nam pišite."}
          </p>
          <a
            href={applicationsOpen ? "#prijava" : `mailto:${siteConfig.email}?subject=Prijava na treninge`}
            className="shrink-0 text-[14px] font-medium text-gold transition-colors hover:text-gold-hover"
          >
            {applicationsOpen ? "Prijavite se →" : "Pišite nam →"}
          </a>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <Overline>Kako je na treningu</Overline>
              <SectionHeading className="mb-6">Več kot le vaja dihanja in tehnike</SectionHeading>
              <p className="mb-6 text-[17px] leading-[1.7] text-body">
                Vsak teden se zberemo v bazenu — 15 minut ogrevanja in dihalnih
                vaj na suhem, nato 60 minut v vodi. Plavanje, potopi, dihalne
                serije. Vsak teden malo boljši kot prejšnji.
              </p>
              <p className="mb-8 text-[17px] leading-[1.7] text-body">
                A treningi niso le fizika. So ljudje, ki jih srečaš vsak teden
                ob isti uri v istem bazenu — in ki sčasoma postanejo prijatelji.
                Nekateri trenirajo z nami že 12 let. Nekateri so postali
                inštruktorji. Nekateri tekmujejo na državnih prvenstvih.
              </p>
              <div className="border-l-2 border-gold/40 pl-4">
                <p className="text-[15px] italic leading-relaxed text-navy/60">
                  &ldquo;Začela sem kot popolna začetnica. Danes plavam 150
                  metrov pod vodo brez plavuti in pomagam voditi treninge.&rdquo;
                </p>
                <p className="mt-1 text-[13px] text-muted-text">— Polona, trenerka, 8 let z nami</p>
              </div>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/placeholder/trening-camp.jpg"
                alt="Trening prostega potapljanja"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-20 md:py-28" id="programi">
        <div className="mx-auto max-w-6xl px-6">
          <Overline>Programi</Overline>
          <SectionHeading className="mb-6 max-w-2xl">Štiri stopnje — ena pot napredka</SectionHeading>
          <p className="mb-4 max-w-2xl text-[17px] leading-[1.7] text-body">
            Ob prijavi izberete skupino glede na vaše izkušnje. Večina začne v
            začetni skupini in trenira tam vso sezono — pravilno plavanje je osnova vsega.
          </p>
          <p className="mb-14 max-w-2xl border-l-4 border-gold pl-6 text-[15px] font-medium text-navy">
            Izjema: če ste v preteklosti aktivno trenirali plavanje, se lahko ob
            prijavi vključite v nadaljevalno skupino.
          </p>
          <div className="max-w-3xl space-y-6">
            {[
              { step: "1", title: "Začetni program", who: "Za vse, ki začenjate — brez predhodnih izkušenj", what: "Tehnika plavanja (kraul, prsno, delfin), osnove zadrževanja diha, varne progresije pod vodo. Prva tretjina sezone: plavanje. Nato: apneja. Po sezoni ali dveh napredujete v nadaljevalno skupino." },
              { step: "2", title: "Nadaljevalni program", who: "Za tiste z ustrezno plavalno tehniko", what: "Aerobni in anaerobni trening, CO₂/O₂ tolerance, intenzivnejše podvodno plavanje. Sistematična periodizacija za resen napredek." },
              { step: "3", title: "Performance program", who: "Za izkušene potapljače s tekmovalnimi ambicijami", what: "Dolgi potopi s specializiranimi plavutmi, intenzivni seti, individualno spremljanje napredka. Mnogi kombinirajo: enkrat tedensko nadaljevalni, enkrat performance." },
              { step: "4", title: "Statična apneja", who: "Za vse — brez predpogojev", what: "Sprostitvene tehnike, prilagajanje na CO₂, progresivni protokoli zadrževanja diha. Lahko kombinirate s katerim koli drugim programom." },
            ].map((program) => (
              <div key={program.step} className="flex items-start gap-6 border-b border-border-custom pb-6">
                <span className="w-10 shrink-0 text-[36px] font-bold leading-none text-gold/30">{program.step}.</span>
                <div>
                  <h3 className="mb-1 text-[20px] font-semibold">{program.title}</h3>
                  <p className="mb-2 text-[14px] font-medium text-gold">{program.who}</p>
                  <p className="text-[15px] leading-[1.6] text-body">{program.what}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials reviews={reviews} overline="Naši treniranke in treniranki" heading="Zakaj ostanejo" />

      <section className="bg-surface py-20 md:py-28" id="prijava">
        <div className="mx-auto max-w-6xl px-6">
          <Overline>Lokacije in urnik</Overline>
          <SectionHeading className="mb-4">Kje in kdaj potekajo treningi</SectionHeading>
          <p className="mb-12 max-w-3xl text-[17px] leading-[1.7] text-body">
            Najprej izberite mesto in bazen, nato poiščite skupino, ki ustreza
            vašemu znanju in urniku. Mesto rezervirate s plačilom letne članarine {membershipFee} €.
          </p>
          <TrainingScheduleSelector groups={groups} applicationsOpen={applicationsOpen} membershipFee={membershipFee} />
        </div>
      </section>

      <section className="py-12">
        <PhotoGallery photos={trainingPhotos} />
      </section>

      <FAQ items={faqs} surface />

      <section className="bg-navy py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-6 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px]">
            Pridružite se 350+ potapljačem v bazenu
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-[18px] text-white/60">
            Vsak teden, od oktobra do junija, na 7 lokacijah po Sloveniji.
            Začnite v začetni skupini — in rastite z nami.
          </p>
          <Button asChild size="xl">
            <a href="#prijava">Prijavite se na treninge →</a>
          </Button>
        </div>
      </section>
    </>
  );
}
