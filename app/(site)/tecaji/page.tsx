import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { FinalCTA } from "@/components/blocks/FinalCTA";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Tečaji prostega potapljanja",
  description:
    "SSI certificirani tečaji prostega potapljanja v Sloveniji. Od prvega potopa na en vdih do naprednih tehnik izenačevanja in globine. Začetni, nadaljevalni in master tečaj.",
  path: "/tecaji",
  image: "/images/tecaji-CTA.webp",
  imageAlt: "Tečaji prostega potapljanja Apnea Slovenija",
});

const courses = [
  {
    key: "zacetni" as const,
    overline: "SSI Freediving Level 1",
    title: "Začetni tečaj",
    description:
      "Za vse, ki želite pod morsko gladino doživeti več kot samo pogled s površine. Naučite se zadrževanja diha, izenačevanja, tehnike potopa in osnov, s katerimi se v vodi počutite mirno in samozavestno.",
    depth: "do 20 m",
    hours: ["6 h teorije", "3 h bazen", "6 h morje"],
    prereq: "Brez predznanja, znati morate plavati 200 m",
    image: "/images/tecaji-zacetni-hero.webp",
    imageAlt: "Skupina na začetnem tečaju prostega potapljanja v bazenu",
    imagePosition: "center 48%",
    href: "/tecaji/zacetni",
    highlight: true,
  },
  {
    key: "nadaljevalni" as const,
    overline: "SSI Freediving Level 2",
    title: "Nadaljevalni tečaj",
    description:
      "Za tiste, ki ste po začetnem tečaju ugotovili, da želite globlje, mirneje in z boljšo tehniko. Naučite se Frenzel izenačevanja, prostega pada in dela na globinah, kjer se prosto potapljanje odpre na novo.",
    depth: "25–35 m",
    hours: ["8 h teorije", "3 h bazen", "8 h morje"],
    prereq: "Opravljen začetni tečaj (Level 1)",
    image: "/images/tecaji-nadaljevalni-hero.webp",
    imageAlt: "Nadaljevalni tečaj prostega potapljanja v morju",
    imagePosition: "center 52%",
    href: "/tecaji/nadaljevalni",
    highlight: false,
  },
  {
    key: "master" as const,
    overline: "SSI Freediving Level 3",
    title: "Master tečaj",
    description:
      "Za izkušene potapljače, ki želijo razumeti napredne tehnike in se pripraviti na globine do 40 metrov. Mouthfill izenačevanje, več globinskega dela in 2 vodena treninga po zaključku.",
    depth: "30–40 m",
    hours: ["10 h teorije", "3 h bazen", "12 h morje"],
    prereq: "Opravljen nadaljevalni tečaj (Level 2)",
    image: "/images/tecaji-master-hero.webp",
    imageAlt: "Master tečaj prostega potapljanja",
    imagePosition: "center 52%",
    href: "/tecaji/master",
    highlight: false,
  },
];

export default function TecajiPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[580px] md:min-h-[640px] flex items-end overflow-hidden">
        <Image
          src="/images/tecaji-zacetni-hero.webp"
          alt=""
          fill
          priority
          className="object-cover"
          style={{ objectPosition: "center 45%" }}
        />
        <div className="absolute inset-0 bg-navy/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
        <div className="relative w-full max-w-6xl mx-auto px-6 pb-14 md:pb-20">
          <div className="max-w-3xl">
            <Overline>Tečaji prostega potapljanja</Overline>
            <h1 className="text-[36px] md:text-[56px] font-bold leading-[1.04] text-white mb-6">
              Naučite se prostega potapljanja, od prvega potopa do naprednih globin
            </h1>
            <p className="text-[17px] md:text-[20px] text-white/78 leading-[1.6] font-body max-w-2xl">
              Če želite bolje doživeti morje, napredovati v podvodnem ribolovu
              ali končno ugotoviti, kaj vaše telo zmore na en vdih, začnite
              tukaj. Tečaji so SSI certificirani in jih vodi{" "}
              <strong className="text-white">Samo Jeranko</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="#zacetni">Izberite tečaj →</Link>
              </Button>
              <Link
                href="/prosto-potapljanje"
                className="inline-flex items-center px-6 py-4 text-[15px] font-medium text-white/85 font-body hover:text-gold transition-colors"
              >
                Kaj je prosto potapljanje?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Course cards */}
      <Section className="py-16 md:py-20">
        <div className="mb-10 max-w-2xl">
          <Overline>Tečaji</Overline>
          <SectionHeading>
            Izberite svoj tečaj
          </SectionHeading>
          <p className="mt-4 text-[17px] text-body leading-[1.7] font-body">
            Od prvih potopov do 40 m globine in profesionalnim tehnikam.
          </p>
        </div>
        <div className="space-y-8">
          {courses.map((course) => (
            <div
              key={course.key}
              id={course.key}
              className={`grid overflow-hidden border bg-white md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_220px] ${
                course.highlight
                  ? "border-gold"
                  : "border-border-custom"
              }`}
            >
              <div className="relative min-h-[220px] lg:min-h-[260px]">
                <Image
                  src={course.image}
                  alt={course.imageAlt}
                  fill
                  className="object-cover"
                  style={{ objectPosition: course.imagePosition }}
                  sizes="(min-width: 1024px) 260px, 100vw"
                />
                {course.highlight && (
                  <div className="absolute left-4 top-4 bg-gold px-3 py-1 text-[12px] font-medium uppercase text-white font-body">
                    Najbolj priljubljen
                  </div>
                )}
              </div>

              <div className="p-7 md:p-8">
                <Overline>{course.overline}</Overline>
                <h2 className="text-[28px] md:text-[32px] font-semibold leading-[1.15] mb-4">
                  {course.title}
                </h2>
                <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                  {course.description}
                </p>

                <div className="grid gap-5 sm:grid-cols-3 mb-6">
                  <div>
                    <p className="text-sm text-muted-text font-body mb-1">
                      Globina
                    </p>
                    <p className="text-[17px] font-medium text-navy font-body">
                      {course.depth}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-text font-body mb-1">
                      Obseg
                    </p>
                    <p className="text-[17px] font-medium text-navy font-body">
                      {course.hours.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-text font-body mb-1">
                      Predpogoj
                    </p>
                    <p className="text-[15px] text-navy font-body">
                      {course.prereq}
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex flex-col justify-between border-t border-border-custom p-7 md:col-span-2 md:p-8 lg:col-span-1 lg:border-l lg:border-t-0">
                <div>
                  <p className="text-[36px] font-bold text-navy font-heading leading-none mb-2">
                    {siteConfig.courses[course.key].price} €
                  </p>
                </div>
                <Button asChild className="text-center">
                  <Link href={course.href}>Več o tečaju →</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gift voucher callout */}
      <Section surface>
        <div className="text-center max-w-2xl mx-auto">
          <SectionHeading center className="mb-4">
            Tečaj je tudi odlično darilo
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            Podarite izkušnjo, ki je človek ne pozabi po enem vikendu. Darilni
            bon velja 1 leto in je na voljo za vse tečaje.
          </p>
          <Button asChild>
            <Link href="/darilni-bon">Darilni bon →</Link>
          </Button>
        </div>
      </Section>

      <FinalCTA
        backgroundImage="/images/tecaji-CTA.webp"
        imagePosition="center 70%"
        heading="Kateri tečaj je pravi za vas?"
        description="Niste prepričani, ali začeti z začetnim tečajem ali nadaljevati na višji stopnji? Pišite nam in pomagali vam bomo izbrati pravi tečaj glede na vaše izkušnje in cilje."
        buttonText="Kontaktirajte nas →"
        buttonHref="/kontakt"
      />
    </>
  );
}
