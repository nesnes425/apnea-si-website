import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Darilni bon za tečaj prostega potapljanja",
  description:
    "Podarite izkušnjo prostega potapljanja. Darilni bon za začetni tečaj, 395 €. Pošljite povpraševanje in bon uredimo po potrditvi.",
  path: "/darilni-bon",
  image: "/images/darilni-bon-hero.webp",
  imageAlt: "Darilni bon za tečaj prostega potapljanja",
});

const faqs = [
  {
    q: "Kako deluje darilni bon?",
    a: "Pošljete povpraševanje, Samo vam potrdi podatke in pošlje informacije za plačilo oziroma račun. Po potrditvi uredimo digitalni bon. Prejemnik se z bonom prijavi na izbrani termin tečaja po e-pošti na info@apnea.si.",
  },
  {
    q: "Ali lahko prejemnik izbere termin in lokacijo?",
    a: "Da, prejemnik si sam izbere termin in lokacijo tečaja, ki mu najbolj ustreza. Termini se izvajajo od marca do avgusta na 5 lokacijah po Sloveniji.",
  },
  {
    q: "Ali bon vključuje opremo?",
    a: "Bon vključuje celoten tečaj (teorija, bazen, morje, certifikat). Izposoja opreme je možna pri naši partnerski trgovini Aquamanija.",
  },
  {
    q: "Koliko časa velja bon?",
    a: "1 leto od datuma izdaje bona. V tem času se prejemnik prijavi na poljuben termin tečaja.",
  },
  {
    q: "Kaj če prejemnik že ima začetni tečaj?",
    a: "Bon je mogoče uporabiti tudi za nadaljevalni ali master tečaj, doplača se razlika v ceni. Pišite nam na info@apnea.si.",
  },
];

const giftPhotos = [
  { src: "/images/darilni-bon-galerija-2.webp", alt: "Tečaj prostega potapljanja", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-3.webp", alt: "Vesela skupina po tečaju", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-4.webp", alt: "Potapljanje v morju", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-5.webp", alt: "Samo med poukom", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-6.webp", alt: "Prosto potapljanje", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-7.webp", alt: "Tečaj prostega potapljanja", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-8.webp", alt: "Potapljanje", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-9.webp", alt: "Skupina tečajnikov", aspect: 1.5 },
  { src: "/images/darilni-bon-galerija-10.webp", alt: "Prosto potapljanje v morju", aspect: 1.5 },
];

export default function DarilniBonPage() {
  return (
    <>
      {/* ============================================
          HERO — emotional, gift-focused
          ============================================ */}
      <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center">
        <Image
          src="/images/darilni-bon-hero.webp"
          alt="Prosto potapljanje — nepozabna izkušnja"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
        <div className="absolute inset-0 bg-white/60 md:hidden" />

        <div className="relative w-full max-w-6xl px-6 mx-auto py-16 md:py-20">
          <div className="max-w-lg">
            <Overline>Darilni bon</Overline>
            <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-5">
              Darilo, ki si ga zapomnijo za vedno
            </h1>
            <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-3">
              Podarite izkušnjo prostega potapljanja: prvi potop pod morsko
              gladino, prvi dve minuti zadrževanja diha, prvi pogled na svet,
              ki ga večina nikoli ne vidi.
            </p>
            <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
              {siteConfig.courses.zacetni.price} €
            </p>
            <Button asChild>
              <a href="/darilni-bon/nakup">Pošljite povpraševanje →</a>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          WHY THIS GIFT — emotional scenarios with photos
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Overline>Zakaj je to najboljše darilo</Overline>
          <SectionHeading className="mb-16 max-w-2xl">
            Ne podarite stvari. Podarite izkušnjo.
          </SectionHeading>

          {/* Scenario 1 — text left, photo right */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
            <div>
              <h3 className="text-[22px] font-semibold mb-4">
                Za ljubitelje morja in pustolovščin
              </h3>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-4">
                Partner, prijatelj ali družinski član, ki obožuje morje, a še
                nikoli ni poskusil prostega potapljanja. Podarite mu izkušnjo,
                ki je ne bo pozabil: miren potop, dolgo zadrževanje diha in
                nov pogled na morje.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                Tečaj vodi Samo Jeranko z ekipo izkušenih inštruktorjev:
                strokovno, mirno in v majhnih skupinah.
              </p>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/darilni-bon-zakaj-1.webp"
                alt="Potapljanje v morju"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Scenario 2 — photo left, text right */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mb-20">
            <div className="relative aspect-[4/3] md:order-1">
              <Image
                src="/images/darilni-bon-zakaj-2.webp"
                alt="Vesela skupina po tečaju"
                fill
                className="object-cover"
              />
            </div>
            <div className="md:order-2">
              <h3 className="text-[22px] font-semibold mb-4">
                Za podvodne ribiče in jadralce
              </h3>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-4">
                Vsak podvodni ribič potrebuje osnove prostega potapljanja za
                varne in daljše potope. Vsak jadralec bi moral znati rešiti
                sidro ali se potopiti za izgubljenimi ključi.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                Tečaj jim da tehniko, samozavest in navdušenje nad lastnimi
                sposobnostmi.
              </p>
            </div>
          </div>

          {/* Scenario 3 — text left, photo right */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h3 className="text-[22px] font-semibold mb-4">
                Za starše, ki želijo več
              </h3>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                Starši, ki snorklajo z otroki in si želijo, da bi zmogli več
                kot le opazovati z gladine. Po tečaju bodo otroku prinesli
                školjko z morskega dna, kmalu pa jih bo otrok vprašal:{" "}
                &bdquo;Ali lahko naučiš tudi mene?&ldquo;
              </p>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/darilni-bon-zakaj-3.webp"
                alt="Samo med poukom v bazenu"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PHOTO GALLERY — show what they'll experience
          ============================================ */}
      <section className="bg-surface py-16">
        <div className="max-w-6xl mx-auto px-6 mb-8 md:mb-10">
          <h2 className="text-[24px] md:text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] text-navy">
            To je izkušnja, ki jo podarite.
          </h2>
        </div>
        <PhotoGallery photos={giftPhotos} />
      </section>

      {/* ============================================
          HOW IT WORKS + PURCHASE
          ============================================ */}
      <section className="py-20 md:py-28" id="nakup">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16">
            {/* How it works */}
            <div>
              <Overline>Kako deluje</Overline>
              <SectionHeading className="mb-10">
                Trije koraki do darila
              </SectionHeading>

              <ol className="space-y-10">
                {[
                  {
                    step: "1",
                    title: "Pošljete povpraševanje",
                    text: "Vpišete svoje podatke, ime obdarjenca in morebitno osebno sporočilo.",
                  },
                  {
                    step: "2",
                    title: "Uredimo potrditev in plačilo",
                    text: "Samo vam potrdi podatke in pošlje informacije za plačilo oziroma račun.",
                  },
                  {
                    step: "3",
                    title: "Prejmete digitalni bon",
                    text: "Po potrditvi uredimo digitalni bon. Prejemnik se nato prijavi na izbrani termin in lokacijo tečaja.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-6 items-start">
                    <span className="text-[36px] font-bold text-gold font-heading leading-none shrink-0 w-10">
                      {item.step}.
                    </span>
                    <div>
                      <h3 className="text-[17px] font-medium text-navy font-body mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[15px] text-body leading-[1.6] font-body">
                        {item.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Purchase card */}
            <div className="md:sticky md:top-24 self-start">
              <div className="bg-surface p-8 border border-border-custom">
                <Overline>Darilni bon</Overline>
                <p className="text-[48px] font-bold text-navy font-heading leading-none mb-2">
                  {siteConfig.courses.zacetni.price} €
                </p>
                <p className="text-sm text-muted-text font-body mb-8">
                  Začetni tečaj prostega potapljanja · SSI Level 1
                </p>

                <CheckList
                  items={[
                    "Celoten tečaj (teorija + bazen + morje)",
                    "SSI Freediving Level 1 certifikat",
                    "Digitalno učno gradivo",
                    "Video analiza potopov",
                    "Prejemnik izbere termin in lokacijo",
                    "Velja 1 leto od izdaje",
                  ]}
                />

                <a
                  href="/darilni-bon/nakup"
                  className="block w-full mt-8 bg-gold text-white py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors text-center"
                >
                  Pošljite povpraševanje →
                </a>

                <p className="mt-6 text-sm text-muted-text font-body text-center">
                  Želite bon za nadaljevalni ({siteConfig.courses.nadaljevalni.price} €) ali
                  master tečaj ({siteConfig.courses.master.price} €)?{" "}
                  <a
                    href={`mailto:${siteConfig.email}?subject=Darilni bon`}
                    className="text-gold hover:text-gold-hover transition-colors"
                  >
                    Pišite nam →
                  </a>
                </p>
              </div>

              {/* Occasion hints */}
              <div className="mt-6 p-6 bg-gold-pale">
                <p className="text-[14px] font-medium text-navy font-body mb-2">
                  Idealno darilo za:
                </p>
                <p className="text-[14px] text-body font-body leading-relaxed">
                  Rojstni dan · Božič · Valentinovo · Obletnico · Ali kar tako.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ
        items={faqs}
        overline="Pogosta vprašanja"
        heading="Vprašanja o darilnem bonu"
        surface
      />

      {/* ============================================
          FINAL CTA
          ============================================ */}
      <section className="bg-navy py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[32px] md:text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6 font-heading">
            Darilo, ki jemlje dih
          </h2>
          <p className="text-[18px] text-white/60 font-body mb-10 max-w-2xl mx-auto">
            Prejemnik bo zadržal dih več kot 2 minuti, se potopil pod morsko
            gladino in si tečaj zapomnil za vedno.
          </p>
          <Button asChild size="xl">
            <a href="/darilni-bon/nakup">Pošljite povpraševanje →</a>
          </Button>
        </div>
      </section>
    </>
  );
}
