import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";
import { Testimonials } from "@/components/blocks/Testimonials";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";

export const metadata = {
  title: "Treningi prostega potapljanja",
  description:
    "Celoletni vodeni treningi prostega potapljanja na 7 lokacijah po Sloveniji. Od začetnikov do tekmovalcev. Sezona oktober–junij. Pridružite se 350+ potapljačem.",
};

const locations = [
  { city: "Ljubljana", note: "Več bazenov in terminov", status: "Polno — čakalna lista" },
  { city: "Kranj", note: "", status: "Prosta mesta" },
  { city: "Nova Gorica", note: "", status: "Prosta mesta" },
  { city: "Koper", note: "", status: "Prosta mesta" },
  { city: "Novo Mesto", note: "", status: "Prosta mesta" },
  { city: "Velenje", note: "", status: "Prosta mesta" },
  { city: "Radovljica", note: "", status: "Prosta mesta" },
];

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

export default function TreningiPage() {
  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center">
        <Image
          src="/images/placeholder/tecaj-bazen-samo.png"
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
              Skupnost, ki raste skupaj — vsak teden v bazenu
            </h1>
            <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
              350+ potapljačev na 7 lokacijah po Sloveniji. Od prvega kraula do
              tekmovalnih priprav. Pridružite se skupnosti, kjer se treningi
              spremenijo v prijateljstva, prijateljstva pa v rezultate.
            </p>
            <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
              od €54/mesec + €35 letna članarina
            </p>
            <Button asChild>
              <a href="#prijava">Prijava na treninge →</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Returning trainees bar */}
      <section className="bg-gold-pale py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[15px] text-navy font-medium font-body">
            Že trenirate z nami? Prijave za novo sezono so odprte.
          </p>
          <a
            href="#prijava"
            className="text-[14px] text-gold font-medium font-body hover:text-gold-hover transition-colors shrink-0"
          >
            Prijavite se →
          </a>
        </div>
      </section>

      {/* ============================================
          WHAT IT FEELS LIKE
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <Overline>Kako je na treningu</Overline>
              <SectionHeading className="mb-6">
                Več kot le vaja dihanja in tehnike
              </SectionHeading>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                Vsak teden se zberemo v bazenu — 15 minut ogrevanja in dihalnih
                vaj na suhem, nato 60 minut v vodi. Plavanje, potopi, dihalne
                serije. Vsak teden malo boljši kot prejšnji.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                A treningi niso le fizika. So ljudje, ki jih srečaš vsak teden
                ob isti uri v istem bazenu — in ki sčasoma postanejo prijatelji.
                Nekateri trenirajo z nami že 12 let. Nekateri so postali
                inštruktorji. Nekateri tekmujejo na državnih prvenstvih.
              </p>

              <div className="border-l-2 border-gold/40 pl-4">
                <p className="text-[15px] text-navy/60 italic font-body leading-relaxed">
                  &ldquo;Začela sem kot popolna začetnica. Danes plavam 150
                  metrov pod vodo brez plavuti in pomagam voditi treninge.&rdquo;
                </p>
                <p className="text-[13px] text-muted-text font-body mt-1">
                  — Polona, trenerka, 8 let z nami
                </p>
              </div>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/placeholder/trening-camp.jpg"
                alt="Trening prostega potapljanja"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PROGRAMS — progression, not a menu
          ============================================ */}
      <section className="bg-surface py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Overline>Programi</Overline>
          <SectionHeading className="mb-6 max-w-2xl">
            Štiri stopnje — ena pot napredka
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-4 max-w-2xl">
            Ob prijavi izberete skupino glede na vaše izkušnje. Večina
            začne v začetni skupini in trenira tam vso sezono — pravilno
            plavanje je osnova vsega.
          </p>
          <p className="text-[15px] text-navy font-medium font-body mb-14 max-w-2xl border-l-4 border-gold pl-6">
            Izjema: če ste v preteklosti aktivno trenirali plavanje, se
            lahko ob prijavi vključite v nadaljevalno skupino.
          </p>

          <div className="space-y-6 max-w-3xl">
            {[
              {
                step: "1",
                title: "Začetni program",
                who: "Za vse, ki začenjate — brez predhodnih izkušenj",
                what: "Tehnika plavanja (kraul, prsno, delfin), osnove zadrževanja diha, varne progresije pod vodo. Prva tretjina sezone: plavanje. Nato: apneja. Po sezoni ali dveh napredujete v nadaljevalno skupino.",
              },
              {
                step: "2",
                title: "Nadaljevalni program",
                who: "Za tiste z ustrezno plavalno tehniko",
                what: "Aerobni in anaerobni trening, CO₂/O₂ tolerance, intenzivnejše podvodno plavanje. Sistematična periodizacija za resen napredek.",
              },
              {
                step: "3",
                title: "Performance program",
                who: "Za izkušene potapljače s tekmovalnimi ambicijami",
                what: "Dolgi potopi s specializiranimi plavutmi, intenzivni seti, individualno spremljanje napredka. Mnogi kombinirajo: enkrat tedensko nadaljevalni, enkrat performance.",
              },
              {
                step: "4",
                title: "Statična apneja",
                who: "Za vse — brez predpogojev",
                what: "Sprostitvene tehnike, prilagajanje na CO₂, progresivni protokoli zadrževanja diha. Lahko kombinirate s katerim koli drugim programom.",
              },
            ].map((program) => (
              <div
                key={program.step}
                className="flex gap-6 items-start border-b border-border-custom pb-6"
              >
                <span className="text-[36px] font-bold text-gold/30 font-heading leading-none shrink-0 w-10">
                  {program.step}.
                </span>
                <div>
                  <h3 className="text-[20px] font-semibold mb-1">
                    {program.title}
                  </h3>
                  <p className="text-[14px] text-gold font-medium font-body mb-2">
                    {program.who}
                  </p>
                  <p className="text-[15px] text-body leading-[1.6] font-body">
                    {program.what}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS
          ============================================ */}
      <Testimonials
        reviews={reviews}
        overline="Naši treniranke in treniranki"
        heading="Zakaj ostanejo"
      />

      {/* ============================================
          LOCATIONS + SCHEDULE + SIGNUP
          ============================================ */}
      <section className="bg-surface py-20 md:py-28" id="prijava">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[1fr_360px] gap-16">
            <div>
              <Overline>Lokacije in urnik</Overline>
              <SectionHeading className="mb-10">
                Kje in kdaj potekajo treningi
              </SectionHeading>

              <div className="divide-y divide-border-custom">
                {locations.map((loc) => (
                  <div
                    key={loc.city}
                    className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-[17px] font-medium text-navy font-body">
                        {loc.city}
                      </p>
                      {loc.note && (
                        <p className="text-sm text-muted-text font-body">
                          {loc.note}
                        </p>
                      )}
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

              <p className="mt-8 text-sm text-muted-text font-body">
                Sezona: oktober–junij. V poletnih mesecih organiziramo tudi
                treninge na prostem (morje) in potapljaške kampe.
              </p>
            </div>

            {/* Pricing + signup card */}
            <div className="md:sticky md:top-24 self-start space-y-6">
              <div className="bg-white p-8 border border-border-custom">
                <Overline>Cenik</Overline>
                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[36px] font-bold text-navy font-heading leading-none">
                      €54–62
                    </p>
                    <p className="text-sm text-muted-text font-body">
                      mesečna vadnina · odvisno od lokacije
                    </p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-navy font-heading">
                      + €{siteConfig.trainings.membership.price}
                    </p>
                    <p className="text-sm text-muted-text font-body">
                      letna članarina ·{" "}
                      {siteConfig.trainings.membership.entity}
                    </p>
                  </div>
                </div>

                <CheckList
                  items={[
                    "Program zasnuje Samo Jeranko",
                    "Majhne skupine (pod 5 na progo)",
                    "Plačilo v 2 obrokih",
                    "Sezona oktober–junij",
                  ]}
                />

                {/* Signup placeholder */}
                <div className="mt-8 pt-6 border-t border-border-custom">
                  <p className="text-[15px] font-medium text-navy font-body mb-4">
                    Prijavite se
                  </p>
                  <div className="space-y-3">
                    <label htmlFor="training-email" className="sr-only">E-pošta</label>
                    <input
                      id="training-email"
                      type="email"
                      placeholder="vas@email.si"
                      className="w-full border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
                    />
                    <button
                      type="button"
                      className="w-full bg-gold text-white py-3 text-[14px] font-medium font-body hover:bg-gold-hover transition-colors"
                    >
                      Prijavite se →
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-text font-body">
                Ljubljana se zapolni najhitreje. Prijavite se čim prej.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PHOTO GALLERY
          ============================================ */}
      <section className="py-12">
        <PhotoGallery photos={trainingPhotos} />
      </section>

      <FAQ items={faqs} surface />

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[32px] md:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6 font-heading">
            Pridružite se 350+ potapljačem v bazenu
          </h2>
          <p className="text-[18px] text-white/60 font-body mb-10 max-w-2xl mx-auto">
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
