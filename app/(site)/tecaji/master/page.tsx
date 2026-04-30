import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";
import { getUpcomingCourses } from "@/lib/sanity/queries";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { FAQ } from "@/components/blocks/FAQ";
import { FinalCTA } from "@/components/blocks/FinalCTA";
import { Testimonials } from "@/components/blocks/Testimonials";
import { CheckList } from "@/components/blocks/CheckList";

export const metadata = {
  title: "Master tečaj prostega potapljanja — SSI Level 3",
  description:
    "Obvladajte Mouthfill izenačevanje in dosezite 30–40m. SSI Level 3 certifikat + 2 brezplačna vodena treninga. €550.",
};

// === Data ===

const coursePhases = [
  {
    number: "01",
    title: "Teorija",
    duration: "10 ur",
    items: [
      "Napredna fiziologija in dekompresija",
      "Mouthfill tehnika izenačevanja",
      "Air packing in potapljanje z napol praznimi pljuči",
      "Psihologija potapljanja na globini",
    ],
  },
  {
    number: "02",
    title: "Bazen",
    duration: "3 ure",
    items: [
      "Statična apneja — napredne tehnike",
      "Dinamična apneja — optimizacija tehnike",
      "Napredne dihalne vaje",
      "Video analiza",
    ],
  },
  {
    number: "03",
    title: "Morje",
    duration: "12 ur",
    items: [
      "Potopi do 30–40 metrov globine",
      "Mouthfill izenačevanje na globini",
      "Napredne reševalne tehnike",
      "1 inštruktor na 4 udeležence",
    ],
  },
];

const reviews = [
  {
    text: "Master tečaj je bil vrhunec mojega potapljaškega razvoja. Mouthfill mi je odprl globine, ki sem jih prej le sanjal. 38 metrov — brez napora, brez bolečin.",
    name: "Boštjan P.",
    detail: "Master tečaj",
  },
  {
    text: "Sama ne moreš opisati z besedami. Način, kako poučuje na tej ravni — kombinacija tehničnega znanja in umirjenosti — je edinstven. Najboljša investicija v moj šport.",
    name: "Nina S.",
    detail: "Master tečaj",
  },
  {
    text: "Po master tečaju sem se prvič počutil res samostojnega v globini. Razumeš svoje telo, razumeš morje. To ni več tečaj — to je transformacija.",
    name: "Matej R.",
    detail: "Master tečaj",
  },
];

const faqs = [
  {
    q: "Kakšen je predpogoj za master tečaj?",
    a: "Opravljen nadaljevalni tečaj (SSI Level 2 ali enakovredno). Master tečaj je namenjen izkušenim potapljačem, ki želijo obvladati najnaprednejše tehnike.",
  },
  {
    q: "Kaj je Mouthfill tehnika?",
    a: "Mouthfill je najnaprednejša tehnika izenačevanja, ki omogoča potapljanje na globine, kjer običajni Frenzel ne deluje več. Zrak shranite v ustih in ga z jezikom potiskate v ušesa. To je tehnika, ki jo uporabljajo tekmovalci na najvišji ravni.",
  },
  {
    q: "Do katere globine se bom potopil/a?",
    a: "Cilj tečaja je 30–40 metrov. Natančna globina je odvisna od vašega napredka in udobnosti. Varnost je vedno na prvem mestu.",
  },
  {
    q: "Kaj je vključeno poleg tečaja?",
    a: "Poleg celotnega tečaja (teorija, bazen, morje) prejmete tudi 2 brezplačna vodena treninga po zaključku. To vam pomaga utrditi naučene tehnike v praksi.",
  },
  {
    q: "Kje poteka globinski del?",
    a: "Globinski del poteka na lokacijah z ustrezno globino — običajno na Hrvaškem. Natančna lokacija je potrjena ob prijavi.",
  },
  {
    q: "Kako poteka odpoved?",
    a: "Odpoved je mogoča brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno.",
  },
];


// === Sections ===

function Hero() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[640px] flex items-center">
      <Image
        src="/images/placeholder/samo-cmas-2025.png"
        alt="Samo Jeranko na tekmovanju"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
      <div className="absolute inset-0 bg-white/60 md:hidden" />

      <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
        <div className="max-w-lg">
          <Overline>Master tečaj</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
            Obvladajte globino do 40 metrov
          </h1>
          <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
            Naučite se Mouthfill izenačevanja, najnaprednejše tehnike, ki
            odpira vrata globin, kamor se je mogoče potopiti le z znanji
            najboljših. Po tečaju prejmete 2 brezplačna vodena treninga.
          </p>
          <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
            €{siteConfig.courses.master.price}
          </p>
          <div className="mb-10">
            <a
              href="#termini"
              className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
            >
              Rezervirajte mesto →
            </a>
          </div>

          <div className="border-l-2 border-gold/40 pl-4">
            <p className="text-[15px] text-navy/60 italic font-body leading-relaxed">
              &ldquo;To ni več tečaj — to je transformacija.&rdquo;
            </p>
            <p className="text-[13px] text-muted-text font-body mt-1">
              — Matej R., udeleženec master tečaja
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyMaster() {
  return (
    <Section>
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <Overline>Zakaj master tečaj?</Overline>
          <SectionHeading className="mb-6">
            Za tiste, ki želite več kot &ldquo;dovolj globoko&rdquo;
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
            Na nadaljevalnem tečaju ste spoznali Frenzel in globino do 35
            metrov. Toda tam se Frenzel začne ustaviti — pljuča so preveč
            stisnjena. Mouthfill je tehnika, ki to mejo premika.
          </p>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            Master tečaj je za potapljače, ki jih globina ne samo zanima, ampak
            jih vleče. Ki želijo razumeti svoje telo na ravni, ki je
            presega večino športov. In ki želijo to početi varno, z mentorstvom
            nekoga, ki je bil tam.
          </p>
          <p className="text-[15px] text-navy font-medium font-body border-l-4 border-gold pl-6">
            Predpogoj: opravljen nadaljevalni tečaj (SSI Level 2 ali enakovredno).
          </p>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/placeholder/prosto-potapljanje-depth.jpg"
            alt="Globinsko prosto potapljanje"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

function OutcomePromise() {
  return (
    <Section surface>
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <Overline>Pričakovan napredek</Overline>
          <SectionHeading className="mb-10">
            Kam vas popelje ta tečaj
          </SectionHeading>

          <div className="space-y-10">
            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                40 m
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Cilj tečaja: udobno in varno potapljanje do 30–40 metrov
                globine z Mouthfill izenačevanjem.
              </p>
            </div>

            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                12 ur
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Morje — najbolj obsežen globinski del med vsemi tečaji. Dovolj
                časa za dejansko napredovanje, ne le spoznavanje.
              </p>
            </div>

            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                +2
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Brezplačna vodena treninga po tečaju — da utrdite naučeno v
                praksi, pod nadzorom inštruktorja.
              </p>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/placeholder/trening-camp.jpg"
            alt="Trening prostega potapljanja"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

function CourseStructure() {
  return (
    <Section surface id="tecaj">
      <Overline>Potek tečaja</Overline>
      <SectionHeading className="mb-6 max-w-2xl">
        Tri faze do master nivoja
      </SectionHeading>
      <p className="text-[17px] text-body leading-[1.7] font-body mb-14 max-w-2xl">
        Najobsežnejši tečaj — 10 ur teorije, 3 ure bazena in 12 ur
        globinskega dela. Plus 2 vodena treninga po zaključku.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {coursePhases.map((phase) => (
          <div
            key={phase.number}
            className="border border-border-custom bg-white p-8"
          >
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-[40px] font-bold text-gold/30 font-heading leading-none">
                {phase.number}
              </span>
              <div>
                <h3 className="text-[22px] font-semibold">{phase.title}</h3>
                <p className="text-sm text-muted-text font-body">
                  {phase.duration}
                </p>
              </div>
            </div>
            <CheckList items={phase.items} />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <CheckList
          items={[
            "SSI Freediving Level 3 certifikat",
            "2 brezplačna vodena treninga",
            "Zavarovanje med tečajem",
            "Majhne skupine (maks. 4 v morju)",
          ]}
          columns={4}
        />
      </div>
    </Section>
  );
}

async function DatesAndBooking() {
  const courses = await getUpcomingCourses("master");

  return (
    <section id="termini" className="bg-surface py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[1fr_360px] gap-16">
          <div>
            <Overline>Naslednji termini</Overline>
            <SectionHeading className="mb-10">
              Izberite termin
            </SectionHeading>

            {courses.length === 0 ? (
              <p className="text-[17px] text-body font-body py-5">
                Master tečaji se izvedejo po dogovoru, ko se zbere zadostno število
                prijavljenih. Pišite nam na{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-gold hover:text-gold-hover transition-colors">
                  {siteConfig.email}
                </a>{" "}
                in vas vključimo v naslednjo skupino.
              </p>
            ) : (
              <div className="divide-y divide-border-custom">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    className={`py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      course.isFull ? "opacity-50" : ""
                    }`}
                  >
                    <div>
                      <p className="text-[17px] font-medium text-navy font-body">
                        {formatCourseDateRange(course.startDate, course.endDate)}
                      </p>
                      <p className="text-sm text-muted-text font-body">
                        {course.location} · Bazenski del
                      </p>
                    </div>
                    {course.isFull ? (
                      <span className="text-sm text-muted-text font-body">
                        Razprodano
                      </span>
                    ) : (
                      <Link
                        href={`/tecaji/master/prijava?instanceId=${course._id}`}
                        className="bg-gold text-white px-6 py-2.5 text-[14px] font-medium font-body hover:bg-gold-hover transition-colors shrink-0 inline-block"
                      >
                        Rezerviraj →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-sm text-muted-text font-body">
              Natančni datumi in lokacija globinskega dela se potrdijo po zadostnem
              številu prijav.
            </p>
          </div>

          <div className="md:sticky md:top-24 self-start">
            <div className="bg-white p-8 border border-border-custom">
              <Overline>Master tečaj</Overline>
              <p className="text-[48px] font-bold text-navy font-heading leading-none mb-2">
                €{siteConfig.courses.master.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-8">
                Vse vključeno. Brez skritih stroškov.
              </p>

              <CheckList
                items={[
                  "Teorija + bazen + morje (12 ur!)",
                  "SSI Freediving Level 3 certifikat",
                  "2 brezplačna vodena treninga",
                  "Digitalno učno gradivo",
                  "Zavarovanje med tečajem",
                  "Fotografije in video s tečaja",
                ]}
              />

              <p className="mt-8 text-sm text-muted-text font-body text-center">
                Nimate še nadaljevalnega tečaja?{" "}
                <a
                  href="/tecaji/nadaljevalni"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Nadaljevalni tečaj →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === Page ===

export default function MasterTecajPage() {
  return (
    <>
      <Hero />
      <SocialProofBar />
      <WhyMaster />
      <OutcomePromise />
      <CourseStructure />
      <Testimonials reviews={reviews} />
      <DatesAndBooking />
      <FAQ items={faqs} />
      <FinalCTA
        heading="Globina, ki jo razumete. Ne le dosežete."
        description={`Master tečaj prostega potapljanja — Mouthfill, 30–40m, 2 vodena treninga. €${siteConfig.courses.master.price}.`}
        backgroundImage="/images/placeholder/prosto-potapljanje-depth.jpg"
      />
    </>
  );
}
