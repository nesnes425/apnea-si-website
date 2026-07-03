import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
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
import { ContextLinks } from "@/components/blocks/ContextLinks";

export const metadata = pageMetadata({
  title: "Začetni tečaj prostega potapljanja | SSI Level 1",
  description:
    "Začetni tečaj prostega potapljanja s Samom Jerankom: varni potopi do 20 m in zadrževanje sape več kot 2 minuti. SSI Level 1 certifikat. 395 €.",
  path: "/tecaji/zacetni",
  image: "/images/tecaji-zacetni-hero.webp",
  imageAlt: "Začetni tečaj prostega potapljanja Apnea Slovenija",
});

export const revalidate = 60;

// === Page-specific data ===

const coursePhotos = [
  { src: "/images/tecaji-zacetni-galerija-1.webp", alt: "Tečaj prostega potapljanja" },
  { src: "/images/tecaji-zacetni-galerija-7.webp", alt: "Potop v globino" },
  { src: "/images/tecaji-zacetni-galerija-2.webp", alt: "Potapljanje v morju" },
  { src: "/images/tecaji-zacetni-galerija-3.webp", alt: "Samo Jeranko med poukom v bazenu" },
  { src: "/images/tecaji-zacetni-galerija-8.webp", alt: "Prosto potapljanje" },
  { src: "/images/tecaji-zacetni-galerija-4.webp", alt: "Vesela skupina tečajnikov" },
  { src: "/images/tecaji-zacetni-galerija-5.webp", alt: "Trening prostega potapljanja" },
  { src: "/images/tecaji-zacetni-galerija-6.webp", alt: "Tečaj v bazenu" },
];

const stories = [
  {
    icon: "/images/icons/fish.webp",
    title: "Postani boljši podvodni ribič",
    text: "Sanjate o kapitalnem ulovu, ko se lahko ribi dovolj globoko mirno približate? Podvodni ribolov zahteva maksimalno varnost, popolno tehniko potopa in brezhibno izenačevanje. Vse to vas naučimo na tečaju.",
  },
  {
    icon: "/images/icons/shell.webp",
    title: "Družinsko šnorklanje in nabiranje školjk",
    text: "Želite varno deliti ljubezen do morja in narave s svojo družino? Naj ne bo morsko dno nekaj nedostopnega, kar opazujemo z gladine. Na tečaju osvojite znanje za varno nabiranje školjk in raziskovanje morskih globin.",
  },
  {
    icon: "/images/icons/dolphin.webp",
    title: "Plavaj z delfini in raziskuj morje",
    text: "Ste na svojih sanjskih počitnicah, a z gladine žalostno opazujete vodiča, kako lahkotno plava z mantami in delfini? Osvojite veščine prostega potapljanja za uživanje v novih, nepozabnih morskih doživetjih.",
  },
  {
    icon: "/images/icons/keys.webp",
    title: "Reši zapeto sidro",
    text: "Vsak mornar se je že srečal z zapetim sidrom, zavozlanim propelerjem ali predmetom, ki je padel v morje. Zato je znanje prostega potapljanja nujna veščina za vsakega odgovornega kapitana.",
  },
];

const coursePhases = [
  {
    number: "01",
    title: "Teorija",
    duration: "6 ur",
    items: [
      "Dihalne tehnike in fiziologija",
      "Potapljaški refleks",
      "Izenačevanje pritiska",
      "Varnost in postopki reševanja",
      "Digitalno učno gradivo v slovenščini",
      "Video analiza",
    ],
  },
  {
    number: "02",
    title: "Bazen",
    duration: "3 ure",
    items: [
      "Statična apneja: zadrževanje diha v mirovanju",
      "Dinamična apneja: plavanje pod vodo",
      "Pravilna tehnika plavanja pod vodo",
      "Reševanje in varnost",
      "Dihalne in sprostitvene vaje",
      "1 inštruktor na do 6 udeležencev",
    ],
  },
  {
    number: "03",
    title: "Morje",
    duration: "6 ur",
    items: [
      "Potopi od 10 do 20 metrov globine",
      "Izenačevanje pritiska",
      "Dihalne vaje pred in po potopu",
      "1 inštruktor na do 4 udeležence",
    ],
  },
];

const reviews = [
  {
    text: "Vrhunski tečaj, super inštruktorji. Priporočam vsakomur, ne glede na izkušnje! Samo zna razložiti vse na preprost in umirjen način. Počutil sem se varno vsak trenutek.",
    name: "Primož E.",
    detail: "Začetni tečaj, Ljubljana",
  },
  {
    text: "To je bil najbolj kakovosten tečaj, kar sem jih kadarkoli obiskovala. Teorija je bila jasna, bazen fantastičen, morje pa nepozabno. Zadržala sem dih 2:45 in se potopila na 16 metrov, na začetnem tečaju!",
    name: "Kaja C.",
    detail: "Začetni tečaj, Koper",
  },
  {
    text: "Samo je izjemen inštruktor. Potrpežljiv, natančen in prilagaja pristop vsakemu posamezniku. Tečaj ni le fizična disciplina, ampak tudi zelo zanimiva izkušnja z lastnim telesom in morjem. Po tečaju sem se vpisal na treninge in ne obžalujem.",
    name: "Aljaž K.",
    detail: "Začetni tečaj, Ljubljana",
  },
];

const faqs = [
  {
    q: "Ali je prosto potapljanje varno?",
    a: "Da. Tečaj poteka pod stalnim nadzorom certificiranih inštruktorjev (SSI Instructor Trainer). V morju je razmerje 1 inštruktor na 4 udeležence. Naučimo vas tudi vseh varnostnih postopkov in reševanja.",
  },
  {
    q: "Moram znati dobro plavati?",
    a: "Morate znati preplavati 200 metrov na površini. To je edini pogoj. Ne potrebujete izkušenj s potapljanjem ali kakršnih koli predhodnih znanj.",
  },
  {
    q: "Kakšna kondicija je potrebna?",
    a: "Potrebna je splošna psihofizična pripravljenost. To pomeni, da ste zdravi brez kroničnih bolezni. Prosto potapljanje temelji na sproščenosti in ne na fizični moči. Na tečaju se naučite pravilne tehnike plavanja s plavutmi, dihanja in sproščanja.",
  },
  {
    q: "Ali je tečaj primeren za otroke?",
    a: "Minimalna starost je 12 let. Mladoletni udeleženci potrebujejo pisno soglasje staršev.",
  },
  {
    q: "Kakšno opremo potrebujem?",
    a: "Kopalke, brisačo in dobro voljo. Vso opremo (masko, plavuti, utežni pas, obleko) si lahko izposodite pri naši partnerski trgovini Aquamanija.",
  },
  {
    q: "Kako poteka odpoved rezervacije?",
    a: "Odpoved je mogoča brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno. Če tečaj odpovemo mi (vreme, nepredvidljive okoliščine), se dogovorimo za nov termin ali vračilo.",
  },
  {
    q: "Kdaj in kje poteka globinski del?",
    a: "Globinski del tečaja poteka na morju (Krk – Omišalj) ali na Bledu. Julija in avgusta smo navadno na Bledu, v drugih terminih pa na morju.",
  },
];

// === Page-specific sections ===

function Hero() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[640px] flex items-center">
      <Image
        src="/images/tecaji-zacetni-hero.webp"
        alt="Prosto potapljanje v čistem jezeru"
        fill
        className="object-cover"
        style={{ objectPosition: "70% center" }}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
      <div className="absolute inset-0 bg-white/60 md:hidden" />

      <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
        <div className="max-w-lg">
          <Overline>Začetni tečaj prostega potapljanja</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
            Potopite se do 20 metrov z enim vdihom
          </h1>
          <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
            Začetni tečaj prostega potapljanja vas vodi od prvega stika z
            masko do razumevanja fiziologije, varnosti, dihanja in
            izenačevanja tlaka. Opremimo vas z znanjem za lahkotne in varne
            potope.
          </p>
          <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
            €{siteConfig.courses.zacetni.price}
          </p>
          <div className="mb-10">
            <Button asChild>
              <a href="#termini">Prijave →</a>
            </Button>
          </div>

          <div className="border-l-2 border-gold/40 pl-4">
            <p className="text-[15px] text-navy/60 italic font-body leading-relaxed">
              &ldquo;Najboljši tečaj, kar sem ga kadarkoli obiskoval. Samo je
              izjemen inštruktor.&rdquo;
            </p>
            <p className="text-[13px] text-muted-text font-body mt-1">
              Aljaž K., {siteConfig.stats.googleReviews} ocen na Google (
              {siteConfig.stats.googleRating} ★)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <Section>
      <Overline>V čem želite napredovati?</Overline>
      <SectionHeading className="mb-16 max-w-2xl">
        Prosto potapljanje ni le šport, je nov način raziskovanja narave
      </SectionHeading>

      <div className="grid md:grid-cols-2 gap-x-16 gap-y-0">
        {stories.map((story, i) => (
          <div
            key={story.title}
            className={`py-8 ${i < 2 ? "border-b border-border-custom" : ""} ${i === 2 ? "md:border-b md:border-border-custom" : ""}`}
          >
            <div className="mb-4">
              <Image
                src={story.icon}
                alt={story.title}
                width={80}
                height={44}
                className="opacity-50 h-[44px] w-auto"
              />
            </div>
            <h3 className="text-[20px] font-semibold mb-2">{story.title}</h3>
            <p className="text-[16px] text-body leading-[1.7] font-body">
              {story.text}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-[17px] text-navy font-medium font-body border-l-4 border-gold pl-6 max-w-2xl">
        Ne potrebujete predznanja ali vrhunske kondicije. Dovolj je, da ste
        stari vsaj 12 let, v dobri psihofizični kondiciji in lahkotno
        preplavate 200 m brez ustavljanja.
      </p>
      <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted-text font-body">
        Če želite najprej razumeti osnove športa, preberite še razlago{" "}
        <Link
          href="/prosto-potapljanje"
          className="text-gold hover:text-gold-hover transition-colors"
        >
          kaj je prosto potapljanje →
        </Link>
      </p>
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
            Rezultati, ki jih dosežete na tečaju
          </SectionHeading>

          <div className="space-y-10">
            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                2 min
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                95% udeležencev zadrži dih več kot 2 minuti med mirnim ležanjem
                na vodi, že na prvi uri v bazenu.
              </p>
              <p className="text-[15px] text-muted-text font-body mt-1 italic">
                Najboljši zadržijo dih tudi več kot 4 minute.
              </p>
            </div>

            <div>
              <p className="text-[56px] md:text-[68px] font-bold text-gold font-heading leading-none">
                15 m
              </p>
              <p className="text-[17px] text-body leading-[1.6] font-body mt-3">
                60% udeležencev se udobno potopi globlje kot 15 metrov že na
                drugi dan globinskega dela tečaja.
              </p>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/tecaji-zacetni-pricakovan-napredek.webp"
            alt="Potapljač med prostim potapljanjem v globino"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

function Instructor() {
  return (
    <Section>
      <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="relative aspect-[4/5] md:aspect-[3/4]">
          <Image
            src="/images/tecaji-zacetni-instruktor.webp"
            alt="Samo Jeranko, inštruktor prostega potapljanja"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <Overline>Vaš inštruktor</Overline>
          <SectionHeading className="mb-6">Samo Jeranko</SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-10">
            Eden najboljših potapljačev na svetu in izkušen inštruktor, ki je v
            zadnjih 15 letih naučil prostega potapljanja več kot 2000 ljudi, od
            popolnih začetnikov do vrhunskih prostih potapljačev. Z vami bo
            delil znanje in veščine, ki jih pri svojih potopih uporabljajo
            svetovni rekorderji.
          </p>

          <div className="grid grid-cols-2 gap-8">
            {[
              { number: "7x", label: "medalja na SP" },
              { number: "2000+", label: "potapljačev" },
              { number: "19x", label: "državni rekorder" },
              { number: "SSI", label: "Instructor Trainer" },
            ].map((stat) => (
              <div key={stat.label} className="border-l-2 border-gold/30 pl-4">
                <p className="text-[24px] font-bold text-navy font-heading">
                  {stat.number}
                </p>
                <p className="text-sm text-muted-text font-body">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
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
          Trije koraki do vašega prvega potopa
        </SectionHeading>
        <p className="text-[17px] text-body leading-[1.7] font-body mb-14 max-w-2xl">
          Tečaj je zasnovan tako, da vas strukturirano vodi od teorije do
          samostojnega potapljanja v morju.
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
              "SSI Freediving Level 1 certifikat",
              "Dihalne vaje in raztezanje",
              "8-tedenski program treninga",
              "Oprema na voljo za izposojo (doplačilo 40 €, brezplačno ob nakupu kosa opreme)",
              "Individualni pristop",
            ]}
            columns={4}
          />
        </div>
      </div>

      <div className="mt-12 md:mt-14">
        <PhotoGallery photos={coursePhotos} />
      </div>
    </section>
  );
}

async function DatesAndBooking() {
  const courses = await getUpcomingCourses("zacetni");

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
                        <Link href={`/tecaji/zacetni/prijava?instanceId=${course._id}`}>
                          Prijava →
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-6 text-sm text-muted-text font-body">
              Globinski del (morje) se izvaja maj–avgust. Termin izberete po
              zaključenem bazenskem delu.
            </p>

            <div className="mt-10 pt-8 border-t border-border-custom">
              <p className="text-[15px] font-medium text-navy font-body mb-4">
                Po rezervaciji:
              </p>
              <ol className="space-y-2">
                {[
                  "Prejmete potrditveni e-mail z vsemi podrobnostmi.",
                  "1 teden pred tečajem prejmete navodila za pripravo.",
              "Pridete na tečaj, za ostalo poskrbimo mi.",
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
              <Overline>Začetni tečaj</Overline>
              <p className="text-[48px] font-bold text-navy font-heading leading-none mb-2">
                €{siteConfig.courses.zacetni.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-8">
                Začetni tečaj prostega potapljanja
              </p>

              <CheckList
                items={[
                  "Teorija + bazen + morje",
                  "SSI Freediving Level 1 certifikat",
                  "Digitalno učno gradivo",
                  "Video analiza potopov",
                  "Dihalne vaje in raztezanje",
                  "8-tedenski program treningov",
                ]}
              />

              <p className="mt-8 text-sm text-muted-text font-body text-center">
                Tečaj je tudi odlično darilo.{" "}
                <a
                  href="/darilni-bon"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Darilni bon →
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

export default function ZacetniTecajPage() {
  return (
    <>
      <CourseJsonLd
        name={siteConfig.courses.zacetni.fullName}
        description="SSI Freediving Level 1: začetni tečaj prostega potapljanja. Vključuje teorijo, bazenski in morski del. Vodi Samo Jeranko, 7x medalist s svetovnih prvenstev."
        url="https://apnea.si/tecaji/zacetni"
        priceInEuros={siteConfig.courses.zacetni.price}
      />
      <Hero />
      <SocialProofBar />
      <StoriesSection />
      <OutcomePromise />
      <Instructor />
      <CourseStructure />
      <Testimonials reviews={reviews} />
      <DatesAndBooking />
      <FAQ items={faqs} />
      <ContextLinks>
        Iščete še bolj praktične odgovore o opremi, prijavi ali poteku?{" "}
        <Link
          href="/vprasanja"
          className="text-gold hover:text-gold-hover transition-colors"
        >
          Odprite celoten FAQ →
        </Link>
      </ContextLinks>
      <FinalCTA
        backgroundImage="/images/tecaji-zacetni-CTA.webp"
        heading="Odkrijte, kaj zmorete pod morsko gladino"
        description={`Začetni tečaj prostega potapljanja vas nauči osnov, s katerimi morje doživite drugače. Cena tečaja je ${siteConfig.courses.zacetni.price} €.`}
      />
    </>
  );
}
