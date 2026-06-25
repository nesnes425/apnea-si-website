import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { FinalCTA } from "@/components/blocks/FinalCTA";
import { CheckList } from "@/components/blocks/CheckList";

export const metadata = {
  title: "Tečaji prostega potapljanja",
  description:
    "SSI certificirani tečaji prostega potapljanja v Sloveniji. Od prvega potopa na en vdih do naprednih tehnik izenačevanja in globine. Začetni, nadaljevalni in master tečaj.",
  alternates: { canonical: "/tecaji" },
};

const courses = [
  {
    key: "zacetni" as const,
    overline: "SSI Freediving Level 1",
    title: "Začetni tečaj",
    description:
      "Za vse, ki želite pod morsko gladino doživeti več kot samo pogled s površine. Naučite se zadrževanja diha, izenačevanja, tehnike potopa in osnov, s katerimi se v vodi počutite mirno in samozavestno.",
    depth: "do 20 m",
    hours: "6 h teorije + 3 h bazen + 6 h morje",
    prereq: "Brez predznanja, znati morate plavati 200 m",
    includes: [
      "SSI Freediving Level 1 certifikat",
      "Digitalno učno gradivo",
      "Video analiza",
      "Oprema za izposojo",
    ],
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
    hours: "8 h teorije + 3 h bazen + 8 h morje",
    prereq: "Opravljen začetni tečaj (Level 1)",
    includes: [
      "SSI Freediving Level 2 certifikat",
      "Globinski del na Hrvaškem",
      "Video analiza",
      "Zavarovanje med tečajem",
    ],
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
    hours: "10 h teorije + 3 h bazen + 12 h morje",
    prereq: "Opravljen nadaljevalni tečaj (Level 2)",
    includes: [
      "SSI Freediving Level 3 certifikat",
      "2 brezplačna vodena treninga",
      "Video analiza",
      "Zavarovanje med tečajem",
    ],
    href: "/tecaji/master",
    highlight: false,
  },
];

export default function TecajiPage() {
  return (
    <>
      {/* Hero */}
      <Section>
        <div className="max-w-2xl">
          <Overline>Tečaji prostega potapljanja</Overline>
          <h1 className="text-[36px] md:text-[52px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-6">
            Naučite se prostega potapljanja, od prvega potopa do naprednih globin
          </h1>
          <p className="text-[17px] md:text-[20px] text-body leading-[1.6] font-body">
            Če želite bolje doživeti morje, napredovati v podvodnem ribolovu
            ali končno ugotoviti, kaj vaše telo zmore na en vdih, začnite tukaj.
            Tečaji so SSI certificirani in jih vodi{" "}
            <strong className="text-navy">
              Samo Jeranko
            </strong>
            , eden najboljših slovenskih potapljačev na vdih in izkušen učitelj
            začetnikov, rekreativcev in tekmovalcev.
          </p>
        </div>
      </Section>

      <SocialProofBar />

      {/* Course cards */}
      <Section>
        <div className="space-y-12">
          {courses.map((course) => (
            <div
              key={course.key}
              className={`grid md:grid-cols-[1fr_320px] gap-10 p-8 md:p-10 border ${
                course.highlight
                  ? "border-gold bg-gold-pale"
                  : "border-border-custom bg-white"
              }`}
            >
              <div>
                <Overline>{course.overline}</Overline>
                <h2 className="text-[28px] md:text-[32px] font-semibold leading-[1.15] mb-4">
                  {course.title}
                </h2>
                <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                  {course.description}
                </p>

                <div className="grid sm:grid-cols-3 gap-6 mb-6">
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
                      {course.hours}
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

                <CheckList items={course.includes} columns={2} />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-[40px] font-bold text-navy font-heading leading-none mb-2">
                    {siteConfig.courses[course.key].price} €
                  </p>
                  <p className="text-sm text-muted-text font-body mb-6">
                    Vse vključeno
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
