import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";
import { getUpcomingCourses } from "@/lib/sanity/queries";
import { Button } from "@/components/ui/button";
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
  title: "Začetni tečaj prostega potapljanja — SSI Level 1",
  description:
    "Naučite se prostega potapljanja z 10-kratnim svetovnim prvakov. Potopite se do 20m, zadržite dih 3 minute. SSI Level 1 certifikat. €395.",
};

// === Page-specific data ===

const coursePhotos = [
  { src: "/images/placeholder/tecaj-bled.png", alt: "Tečaj prostega potapljanja na Bledu" },
  { src: "/images/placeholder/tecaj-morje.png", alt: "Potapljanje v morju" },
  { src: "/images/placeholder/tecaj-bazen-samo.png", alt: "Samo Jeranko med poukom v bazenu" },
  { src: "/images/placeholder/tecaj-skupina.jpg", alt: "Vesela skupina tečajnikov" },
  { src: "/images/placeholder/trening-camp.jpg", alt: "Trening camp prostega potapljanja" },
  { src: "/images/placeholder/tecaj-ljubljana.jpg", alt: "Tečaj v Ljubljani" },
  { src: "/images/placeholder/prosto-potapljanje-depth.jpg", alt: "Potop v globino" },
];

const stories = [
  {
    icon: "/images/icons/fish.webp",
    title: "Postani boljši podvodni ribič",
    text: "Navdihujejo vas posnetki podvodnega ribolova, a veste, da bi morali za resne potope najprej obvladati osnove? Tečaj vas nauči pravilne tehnike potapljanja, zadrževanja diha in varnosti — da se pod vodo počutite samozavestno in ostanete dlje.",
  },
  {
    icon: "/images/icons/shell.webp",
    title: "Otroku prinesi zaklad z morskega dna",
    text: "Otrok opazi čudovito školjko na dnu. Vi se potopite, jo poberete in postanete junak dneva. Tečaj vas usposobi, da to naredite varno in z lahkoto — in kmalu vas vpraša: \"Me naučiš tudi mene?\"",
  },
  {
    icon: "/images/icons/dolphin.webp",
    title: "Plavaj z delfini in raziskuj morje",
    text: "Maldiví, Tenerife, Hrvaška — podvodni svet čaka. Toda brez pravilne tehnike ostanete na površini. Tečaj vam da osnove, da se pod vodo sprostite, pravilno potapljate in uživate v vsakem potopu brez bolečin v ušesih.",
  },
  {
    icon: "/images/icons/keys.webp",
    title: "Reši, kar pade v vodo",
    text: "Ključi, očala, GoPro — vsako poletje kdo kaj izgubi v morju. Z osnovami prostega potapljanja to ni več problem. Le telefona vam verjetno ne bo uspelo rešiti.",
  },
];

const coursePhases = [
  {
    number: "01",
    title: "Teorija",
    duration: "6 ur",
    items: [
      "Dihalne tehnike in fiziologija",
      "Potapljaški refleks in izenačevanje",
      "Varnost in postopki reševanja",
      "Digitalno učno gradivo v slovenščini",
    ],
  },
  {
    number: "02",
    title: "Bazen",
    duration: "3 ure",
    items: [
      "Statična apneja — zadrževanje diha",
      "Dinamična apneja — plavanje pod vodo",
      "Pravilna tehnika potapljanja",
      "Video analiza vaših potopov",
    ],
  },
  {
    number: "03",
    title: "Morje",
    duration: "6 ur",
    items: [
      "Potopi od 10 do 20 metrov globine",
      "Izenačevanje na globini",
      "Dihalne vaje pred in po potopu",
      "1 inštruktor na 4 udeležence",
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
    text: "To je bil najbolj kakovosten tečaj, kar sem jih kadarkoli obiskovala. Teorija je bila jasna, bazen fantastičen, morje pa nepozabno. Zadržala sem dih 2:45 in se potopila na 16 metrov — na začetnem tečaju!",
    name: "Kaja C.",
    detail: "Začetni tečaj, Koper",
  },
  {
    text: "Samo je izjemen inštruktor. Potrpežljiv, natančen in prilagaja pristop vsakemu posamezniku. Tečaj ni le fizična disciplina — je tudi mentalna. Po tečaju sem se vpisal na treninge in ne obžalujem.",
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
    a: "Morate znati preplavati 200 metrov na površini — to je edini pogoj. Ne potrebujete izkušenj s potapljanjem ali kakršnih koli predhodnih znanj.",
  },
  {
    q: "Kakšna kondicija je potrebna?",
    a: "Posebna kondicija ni potrebna. Prosto potapljanje je bolj stvar sproščenosti kot fizične moči. Na tečaju se naučite pravilne tehnike dihanja in sprostitve.",
  },
  {
    q: "Koliko sem star/a moram biti?",
    a: "Minimalna starost je 12 let. Mladoletni udeleženci potrebujejo pisno soglasje staršev.",
  },
  {
    q: "Kaj moram prinesti s seboj?",
    a: "Kopalke, brisačo in dobro voljo. Vso opremo (masko, plavuti, utežni pas, obleko) si lahko izposodite pri naši partnerski trgovini Aquamanija.",
  },
  {
    q: "Kako poteka odpoved rezervacije?",
    a: "Odpoved je mogoča brez stroškov do 10 delovnih dni pred tečajem. Pri poznejši odpovedi se rezervacija šteje za unovčeno. Če tečaj odpovemo mi (vreme, nepredvidljive okoliščine), se dogovorimo za nov termin ali vračilo.",
  },
  {
    q: "Kdaj in kje poteka globinski del?",
    a: "Globinski del (morje) se izvaja od maja do avgusta. Termin in lokacijo izberete po zaključenem bazenskem delu — imate 8 mesecev časa. Potopi potekajo na slovenski obali.",
  },
];

// === Page-specific sections ===

function Hero() {
  return (
    <section className="relative w-full min-h-[560px] md:min-h-[640px] flex items-center">
      <Image
        src="/images/placeholder/tecaj-bled.png"
        alt="Prosto potapljanje v čistem jezeru"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
      <div className="absolute inset-0 bg-white/60 md:hidden" />

      <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
        <div className="max-w-lg">
          <Overline>Začetni tečaj</Overline>
          <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
            Potopite se do 20 metrov na en sam vdih
          </h1>
          <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
            Začetni tečaj prostega potapljanja vas popelje od prvega
            zadrževanja diha do samozavestnega potapljanja v morju — varno,
            strokovno in v majhnih skupinah.
          </p>
          <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
            €{siteConfig.courses.zacetni.price}
          </p>
          <div className="mb-10">
            <Button asChild>
              <a href="#termini">Rezervirajte mesto →</a>
            </Button>
          </div>

          <div className="border-l-2 border-gold/40 pl-4">
            <p className="text-[15px] text-navy/60 italic font-body leading-relaxed">
              &ldquo;Najboljši tečaj, kar sem ga kadarkoli obiskoval. Samo je
              izjemen inštruktor.&rdquo;
            </p>
            <p className="text-[13px] text-muted-text font-body mt-1">
              — Aljaž K., {siteConfig.stats.googleReviews} ocen na Google (
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
      <Overline>V kateri zgodbi se najdete?</Overline>
      <SectionHeading className="mb-16 max-w-2xl">
        Prosto potapljanje ni samo šport — je način, kako doživite morje
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
        Ne potrebujete predznanja ali posebne kondicije. Dovolj je, da znate
        plavati 200 metrov in da ste stari vsaj 12 let.
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
                na vodi — že na prvi uri v bazenu.
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
                60% udeležencev se udobno potopi globlje kot 15 metrov — že na
                drugi dan globinskega dela tečaja.
              </p>
              <p className="text-[15px] text-muted-text font-body mt-1 italic">
                Nekateri brez težav dosežejo tudi 18+ metrov.
              </p>
            </div>
          </div>
        </div>

        <div className="relative aspect-[3/4]">
          <Image
            src="/images/placeholder/prosto-potapljanje-depth.jpg"
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
            src="/images/placeholder/samo-portrait.jpg"
            alt="Samo Jeranko — inštruktor prostega potapljanja"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <Overline>Vaš inštruktor</Overline>
          <SectionHeading className="mb-6">Samo Jeranko</SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-10">
            Eden najboljših potapljačev na svetu in izkušen inštruktor, ki je v
            zadnjih 15 letih naučil prostega potapljanja več kot 2000 ljudi — od
            popolnih začetnikov do tekmovalcev. Zna razložiti vse na preprost in
            umirjen način.
          </p>

          <div className="grid grid-cols-2 gap-8">
            {[
              { number: "10x", label: "medalja na SP" },
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
          Tri faze do vašega prvega potopa
        </SectionHeading>
        <p className="text-[17px] text-body leading-[1.7] font-body mb-14 max-w-2xl">
          Tečaj je zasnovan tako, da vas postopoma vodi od teorije do
          samozavestnega potapljanja v morju. Vsaka faza gradi na prejšnji.
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
              "Oprema na voljo za izposojo",
              "Majhne skupine (maks. 6 v bazenu)",
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
                          Rezerviraj →
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
              <Overline>Začetni tečaj</Overline>
              <p className="text-[48px] font-bold text-navy font-heading leading-none mb-2">
                €{siteConfig.courses.zacetni.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-8">
                Vse vključeno. Brez skritih stroškov.
              </p>

              <CheckList
                items={[
                  "Teorija + bazen + morje",
                  "SSI Freediving Level 1 certifikat",
                  "Digitalno učno gradivo",
                  "Video analiza potopov",
                  "Dihalne vaje in raztezanje",
                  "Oprema za izposojo",
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
      <Hero />
      <SocialProofBar />
      <StoriesSection />
      <OutcomePromise />
      <Instructor />
      <CourseStructure />
      <Testimonials reviews={reviews} />
      <DatesAndBooking />
      <FAQ items={faqs} />
      <FinalCTA
        heading="Potopite se do 20 metrov, zadržite dih 3 minute"
        description={`Odkrijte svet pod morsko gladino z najboljšim inštruktorjem v Sloveniji. Začetni tečaj prostega potapljanja — €${siteConfig.courses.zacetni.price}.`}
      />
    </>
  );
}
