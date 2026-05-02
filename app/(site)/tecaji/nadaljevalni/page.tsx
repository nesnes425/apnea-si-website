import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";
import { getUpcomingCourses } from "@/lib/sanity/queries";
import { Button } from "@/components/ui/button";
import { CourseJsonLd } from "@/components/seo/StructuredData";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { FAQ } from "@/components/blocks/FAQ";
import { FinalCTA } from "@/components/blocks/FinalCTA";
import { Testimonials } from "@/components/blocks/Testimonials";
import { CheckList } from "@/components/blocks/CheckList";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";

export const metadata = {
  title: "Nadaljevalni tečaj prostega potapljanja — SSI Level 2",
  description:
    "Poglobite znanje prostega potapljanja. Frenzel izenačevanje, potopi do 35m. SSI Level 2 certifikat. €415.",
};

// === Data ===

const coursePhases = [
  {
    number: "01",
    title: "Teorija",
    duration: "8 ur",
    items: [
      "Napredna fiziologija potapljanja",
      "Frenzel tehnika izenačevanja",
      "Prosti pad in tehnika potopa",
      "Napredni varnostni postopki",
    ],
  },
  {
    number: "02",
    title: "Bazen",
    duration: "3 ure",
    items: [
      "Statična apneja — cilj 2:30+",
      "Dinamična apneja — cilj 50m+",
      "Napredne dihalne tehnike",
      "Video analiza vaših potopov",
    ],
  },
  {
    number: "03",
    title: "Morje",
    duration: "8 ur",
    items: [
      "Potopi do 25–35 metrov globine",
      "Prosti pad in Frenzel na globini",
      "Reševanje z globine",
      "1 inštruktor na 4 udeležence",
    ],
  },
];

const reviews = [
  {
    text: "Po začetnem tečaju sem vedel, da hočem več. Nadaljevalni tečaj ti odpre povsem novo dimenzijo — Frenzel tehnika spremeni vse. Na 30 metrih se počutiš kot doma.",
    name: "Luka M.",
    detail: "Nadaljevalni tečaj, Ljubljana",
  },
  {
    text: "Samo je neverjeten mentor. Potrpežljivo me je vodil čez Frenzel, dokler ni kliknilo. Globinski del na Krku je bil nepozaben — čista voda, fantastična ekipa.",
    name: "Ana P.",
    detail: "Nadaljevalni tečaj, Krk",
  },
  {
    text: "Mislil sem, da je 20 metrov moja meja. Po nadaljevalnem tečaju sem se udobno potapljal na 32 metrov. Razlika je v tehniki, ne v kondiciji.",
    name: "Gregor T.",
    detail: "Nadaljevalni tečaj, Ljubljana",
  },
];

const faqs = [
  {
    q: "Kakšen je predpogoj za nadaljevalni tečaj?",
    a: "Opravljen začetni tečaj prostega potapljanja (SSI Level 1 ali enakovredno). Znati morate preplavati 400 metrov na površini. Minimalna starost je 16 let.",
  },
  {
    q: "Kaj je Frenzel tehnika?",
    a: "Frenzel je napredna tehnika izenačevanja tlaka v ušesih, ki omogoča udobno potapljanje na večje globine. Uporablja jezik kot bat namesto prepihovanja skozi nos. To je glavna veščina, ki se je naučite na tem tečaju.",
  },
  {
    q: "Do katere globine se bom potopil/a?",
    a: "Cilj tečaja je udobno potapljanje do 25–35 metrov. Večina udeležencev doseže vsaj 25 metrov. Nekateri presežejo 30 metrov že na tečaju.",
  },
  {
    q: "Kje poteka globinski del?",
    a: "Globinski del se izvaja na Hrvaškem — običajno na otoku Krku. Voda je čista in topla, pogoji so idealni za globinsko delo. Poteka čez vikend (petek–nedelja).",
  },
  {
    q: "Kaj moram prinesti s seboj?",
    a: "Kopalke, brisačo in vso svojo opremo, če jo imate. Opremo si lahko tudi izposodite. Za globinski del na Krku priskrbite prevoz in nastanitev (pomagamo z nasveti).",
  },
  {
    q: "Kako poteka odpoved?",
    a: "Odpoved je mogoča brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno.",
  },
];

const coursePhotos = [
  { src: "/images/placeholder/tecaj-morje.png", alt: "Potapljanje v morju" },
  { src: "/images/placeholder/prosto-potapljanje-depth.jpg", alt: "Potop v globino" },
  { src: "/images/placeholder/trening-camp.jpg", alt: "Trening prostega potapljanja" },
  { src: "/images/placeholder/tecaj-bled.png", alt: "Tečaj na Bledu" },
];

// === Sections ===

function Hero() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[640px] flex items-center">
      <Image
        src="/images/placeholder/prosto-potapljanje-depth.jpg"
        alt="Potapljač med potopom v globino"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
      <div className="absolute inset-0 bg-white/60 md:hidden" />

      <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
        <div className="max-w-lg">
          <Overline>Nadaljevalni tečaj</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
            Osvojite globino do 35 metrov
          </h1>
          <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
            Naučite se Frenzel tehnike izenačevanja, obvladajte prosti pad in
            odkrijte, kaj pomeni resnično prosto potapljanje — tam, kjer se
            modrina spremeni v temno modro.
          </p>
          <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
            €{siteConfig.courses.nadaljevalni.price}
          </p>
          <div className="mb-10">
            <Button asChild>
              <a href="#termini">Rezervirajte mesto →</a>
            </Button>
          </div>

          <div className="border-l-2 border-gold/40 pl-4">
            <p className="text-[15px] text-navy/60 italic font-body leading-relaxed">
              &ldquo;Na 30 metrih se počutiš kot doma. Frenzel tehnika spremeni
              vse.&rdquo;
            </p>
            <p className="text-[13px] text-muted-text font-body mt-1">
              — Luka M., udeleženec nadaljevalnega tečaja
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyAdvanced() {
  return (
    <Section>
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <Overline>Zakaj nadaljevalni tečaj?</Overline>
          <SectionHeading className="mb-6">
            Začetni tečaj vam je odprl vrata. Ta vas popelje skozi.
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
            Po začetnem tečaju znate osnove. Toda za resnično potapljanje —
            globine, kjer se čas ustavi, kjer telo preide v prosti pad, kjer
            občutite popolno tišino — potrebujete napredne tehnike.
          </p>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            Frenzel izenačevanje vam odpre globine, ki so z osnovno tehniko
            nedosegljive. Prosti pad — ko prenehate plavati in se prepustite
            gravitaciji — je občutek, ki ga morate izkusiti.
          </p>
          <p className="text-[15px] text-navy font-medium font-body border-l-4 border-gold pl-6">
            Predpogoj: opravljen začetni tečaj (SSI Level 1 ali enakovredno).
          </p>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/placeholder/tecaj-morje.png"
            alt="Prosto potapljanje v morju"
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
                35 m
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Cilj tečaja: udobno in varno potapljanje do 25–35 metrov
                globine s Frenzel izenačevanjem.
              </p>
            </div>

            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                2:30
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Statična apneja — zadrževanje diha več kot 2 minuti in 30
                sekund v mirnem stanju.
              </p>
            </div>

            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                50 m
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                Dinamična apneja — plavanje pod vodo na razdalji 50+ metrov v
                bazenu.
              </p>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/placeholder/trening-camp.jpg"
            alt="Globinsko potapljanje"
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
    <section id="tecaj" className="bg-surface py-24">
      <div className="max-w-6xl mx-auto px-6">
        <Overline>Potek tečaja</Overline>
        <SectionHeading className="mb-6 max-w-2xl">
          Tri faze do naprednega potapljanja
        </SectionHeading>
        <p className="text-[17px] text-body leading-[1.7] font-body mb-14 max-w-2xl">
          Teorija in bazen v Ljubljani, globinski del na Hrvaškem — v čisti
          vodi in idealnih pogojih za delo na globini.
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
              "SSI Freediving Level 2 certifikat",
              "Video analiza in dihalne vaje",
              "Zavarovanje med tečajem",
              "Majhne skupine (maks. 4 v morju)",
            ]}
            columns={4}
          />
        </div>
      </div>

      <div className="mt-16 pb-8">
        <PhotoGallery photos={coursePhotos} />
      </div>
    </section>
  );
}

async function DatesAndBooking() {
  const courses = await getUpcomingCourses("nadaljevalni");

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
                Trenutno ni razpisanih terminov. Pišite nam na{" "}
                <a href={`mailto:${siteConfig.email}`} className="text-gold hover:text-gold-hover transition-colors">
                  {siteConfig.email}
                </a>{" "}
                in vas obvestimo, ko se odprejo prijave.
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
                      <Button asChild size="sm">
                        <Link href={`/tecaji/nadaljevalni/prijava?instanceId=${course._id}`}>
                          Rezerviraj →
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-sm text-muted-text font-body">
              Globinski del poteka na otoku Krku (petek–nedelja). Prevoz in
              nastanitev nista vključena — pomagamo z nasveti.
            </p>

            <div className="mt-10 pt-8 border-t border-border-custom">
              <p className="text-[15px] font-medium text-navy font-body mb-4">
                Po rezervaciji:
              </p>
              <ol className="space-y-2">
                {[
                  "Prejmete potrditveni e-mail z vsemi podrobnostmi.",
                  "1 teden pred tečajem prejmete navodila za pripravo.",
                  "Pridete na tečaj — vse ostalo uredimo mi.",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 items-start text-[15px] text-body font-body"
                  >
                    <span className="text-gold font-medium shrink-0">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="md:sticky md:top-24 self-start">
            <div className="bg-white p-8 border border-border-custom">
              <Overline>Nadaljevalni tečaj</Overline>
              <p className="text-[48px] font-bold text-navy font-heading leading-none mb-2">
                €{siteConfig.courses.nadaljevalni.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-8">
                Vse vključeno. Brez skritih stroškov.
              </p>

              <CheckList
                items={[
                  "Teorija + bazen + morje",
                  "SSI Freediving Level 2 certifikat",
                  "Digitalno učno gradivo",
                  "Video analiza potopov",
                  "Zavarovanje med tečajem",
                  "Fotografije in video s tečaja",
                ]}
              />

              <p className="mt-8 text-sm text-muted-text font-body text-center">
                Nimate še začetnega tečaja?{" "}
                <a
                  href="/tecaji/zacetni"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Začetni tečaj →
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

export default function NadaljevalniTecajPage() {
  return (
    <>
      <CourseJsonLd
        name={siteConfig.courses.nadaljevalni.fullName}
        description="SSI Freediving Level 2 — tečaj za izkušene potapljače. Frenzel izenačevanje, ciljna globina 25–35 m. Vodi Samo Jeranko."
        url="https://apnea.si/tecaji/nadaljevalni"
        priceInEuros={siteConfig.courses.nadaljevalni.price}
      />
      <Hero />
      <SocialProofBar />
      <WhyAdvanced />
      <OutcomePromise />
      <CourseStructure />
      <Testimonials reviews={reviews} />
      <DatesAndBooking />
      <FAQ items={faqs} />
      <FinalCTA
        heading="Odkrijte, kaj se skriva pod 30 metri"
        description={`Nadaljevalni tečaj prostega potapljanja — Frenzel, prosti pad, globine do 35m. €${siteConfig.courses.nadaljevalni.price}.`}
        backgroundImage="/images/placeholder/prosto-potapljanje-depth.jpg"
      />
    </>
  );
}
