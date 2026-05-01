import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";

export const metadata = {
  title: "Darilni bon za tečaj prostega potapljanja",
  description:
    "Podarite izkušnjo prostega potapljanja. Darilni bon za začetni tečaj — €395. Velja 1 leto. Digitalni bon po e-pošti.",
};

const faqs = [
  {
    q: "Kako deluje darilni bon?",
    a: "Po nakupu prejmete digitalni bon s kodo po e-pošti. Prejemnik se z bon kodo prijavi na izbrani termin tečaja po e-pošti na info@apnea.si. Bon velja 1 leto od nakupa.",
  },
  {
    q: "Ali lahko prejemnik izbere termin in lokacijo?",
    a: "Da — prejemnik si sam izbere termin in lokacijo tečaja, ki mu najbolj ustreza. Termini se izvajajo od marca do avgusta na 5 lokacijah po Sloveniji.",
  },
  {
    q: "Ali bon vključuje opremo?",
    a: "Bon vključuje celoten tečaj (teorija, bazen, morje, certifikat). Oprema se izposoja ločeno pri naši partnerski trgovini Aquamanija.",
  },
  {
    q: "Koliko časa velja bon?",
    a: "1 leto od datuma nakupa. V tem času se prejemnik prijavi na poljuben termin tečaja.",
  },
  {
    q: "Kaj če prejemnik že ima začetni tečaj?",
    a: "Bon je mogoče uporabiti tudi za nadaljevalni ali master tečaj — doplača se razlika v ceni. Kontaktirajte nas na info@apnea.si.",
  },
];

const giftPhotos = [
  { src: "/images/placeholder/tecaj-bled.png", alt: "Tečaj prostega potapljanja na Bledu", aspect: 1.5 },
  { src: "/images/placeholder/tecaj-skupina.jpg", alt: "Vesela skupina po tečaju", aspect: 1.5 },
  { src: "/images/placeholder/tecaj-morje.png", alt: "Potapljanje v morju", aspect: 1.5 },
  { src: "/images/placeholder/tecaj-bazen-samo.png", alt: "Samo med poukom", aspect: 1.5 },
];

export default function DarilniBonPage() {
  return (
    <>
      {/* ============================================
          HERO — emotional, gift-focused
          ============================================ */}
      <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center">
        <Image
          src="/images/placeholder/tecaj-bled.png"
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
              Podarite izkušnjo prostega potapljanja — prvi potop pod morsko
              gladino, prvi dve minuti zadrževanja diha, prvi pogled na svet,
              ki ga večina nikoli ne vidi.
            </p>
            <p className="text-[20px] md:text-[22px] font-semibold text-navy font-heading mb-8">
              €{siteConfig.courses.zacetni.price}
            </p>
            <Button asChild>
              <a href="#nakup">Kupite darilni bon →</a>
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
                Partner, prijatelj ali družinski član, ki obožuje morje — a
                nikoli ni poskusil prostega potapljanja. Podarite jim izkušnjo,
                ki je ne bodo pozabili: prvi potop, prvi zadržan dih, prvi
                pogled v modro globino.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                Tečaj vodi 10-kratni svetovni prvak Samo Jeranko. Varno,
                strokovno, v majhnih skupinah.
              </p>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/placeholder/tecaj-morje.png"
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
                src="/images/placeholder/tecaj-skupina.jpg"
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
                varno in daljše potope. Vsak jadralec bi moral znati rešiti
                sidro ali poiskati izgubljeno opremo.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                Tečaj jim da tehniko, samozavest in certifikat, ki ga bodo
                ponosno pokazali.
              </p>
            </div>
          </div>

          {/* Scenario 3 — text left, photo right */}
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <h3 className="text-[22px] font-semibold mb-4">
                Za starše, ki želijo več
              </h3>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-4">
                Starši, ki snorklajo z otroki in si želijo, da bi zmogli več
                kot le gledati z gladine. Po tečaju bodo otroku prinesli
                školjko z morskega dna — in postali njihov junak.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body">
                In kmalu jih bo otrok vprašal: &ldquo;Me naučiš tudi
                mene?&rdquo;
              </p>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/placeholder/tecaj-bazen-samo.png"
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
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <p className="text-sm text-muted-text font-body">
            To je izkušnja, ki jo podarite.
          </p>
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
                Tri koraki do darila
              </SectionHeading>

              <ol className="space-y-10">
                {[
                  {
                    step: "1",
                    title: "Kupite darilni bon",
                    text: "Opravite plačilo — bon stane €395 (začetni tečaj prostega potapljanja, SSI Level 1).",
                  },
                  {
                    step: "2",
                    title: "Prejmete digitalni bon",
                    text: "Po plačilu prejmete bon s kodo po e-pošti — pripravljen za tiskanje ali pošiljanje prejemniku.",
                  },
                  {
                    step: "3",
                    title: "Prejemnik izbere termin",
                    text: "Prejemnik se z bon kodo prijavi na izbrani termin in lokacijo tečaja. Ima 1 leto časa.",
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
                  €{siteConfig.courses.zacetni.price}
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
                    "Velja 1 leto od nakupa",
                  ]}
                />

                <button
                  type="button"
                  className="w-full mt-8 bg-gold text-white py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors"
                >
                  Kupi darilni bon →
                </button>

                <p className="mt-6 text-sm text-muted-text font-body text-center">
                  Želite bon za nadaljevalni (€{siteConfig.courses.nadaljevalni.price}) ali
                  master tečaj (€{siteConfig.courses.master.price})?{" "}
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
                  Rojstni dan · Božič · Valentinovo · Očetovski dan · Materinski
                  dan · Obletnico · Zaključek šolanja · Ali kar tako.
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
            gladino — in vam bo hvaležen za vedno.
          </p>
          <Button asChild size="xl">
            <a href="#nakup">Kupite darilni bon →</a>
          </Button>
        </div>
      </section>
    </>
  );
}
