import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { FAQ } from "@/components/blocks/FAQ";

export const metadata = {
  title: "Darilni bon za tečaj prostega potapljanja",
  description:
    "Podarite izkušnjo prostega potapljanja. Darilni bon za začetni tečaj (€395), nadaljevalni (€415) ali master (€550). Velja 1 leto.",
};

const faqs = [
  {
    q: "Kako deluje darilni bon?",
    a: "Po nakupu prejmete digitalni bon s kodo po e-pošti. Prejemnik se z bon kodo prijavi na izbrani termin tečaja po e-pošti na info@apnea.si. Bon velja 1 leto od nakupa.",
  },
  {
    q: "Za katere tečaje velja bon?",
    a: "Bon je na voljo za vse tečaje: začetni (€395), nadaljevalni (€415) in master (€550). Izberete ob nakupu.",
  },
  {
    q: "Ali lahko prejemnik zamenja vrsto tečaja?",
    a: "Da — če je razlika v ceni, se doplača ali vrne razlika. Kontaktirajte nas na info@apnea.si.",
  },
  {
    q: "Koliko časa velja bon?",
    a: "Bon velja 1 leto od datuma nakupa. V tem času se prejemnik prijavi na poljuben termin tečaja.",
  },
  {
    q: "Ali bon vključuje opremo?",
    a: "Bon vključuje celoten tečaj (teorija, bazen, morje, certifikat). Oprema se izposoja ločeno pri naši partnerski trgovini Aquamanija.",
  },
];

const giftReasons = [
  {
    title: "Za ljubitelje morja",
    text: "Partner, prijatelj ali družinski član, ki obožuje morje, potapljanje ali podvodni svet — a nikoli ni poskusil prostega potapljanja.",
  },
  {
    title: "Za podvodne ribiče",
    text: "Vsak podvodni ribič potrebuje osnove prostega potapljanja za varno in učinkovito lovljenje. Tečaj jim da tehniko in samozavest.",
  },
  {
    title: "Za iskalce doživetij",
    text: "Darilo, ki ni stvar, ampak izkušnja. Nekaj, kar si zapomnijo za vedno — prvi potop pod morsko gladino.",
  },
  {
    title: "Za starše, ki želijo več",
    text: "Starši, ki snorklajo z otroki in si želijo, da bi zmogli več kot le gledati z gladine. Tečaj jim da sposobnost, da otrokom pokažejo morsko dno.",
  },
];

export default function DarilniBonPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative w-full min-h-[480px] md:min-h-[560px] flex items-center">
        <Image
          src="/images/placeholder/tecaj-skupina.jpg"
          alt="Vesela skupina po tečaju prostega potapljanja"
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
              Podarite izkušnjo, ki jemlje dih
            </h1>
            <p className="text-[17px] md:text-[19px] text-body leading-[1.6] font-body mb-8">
              Darilni bon za tečaj prostega potapljanja — darilo, ki ni stvar,
              ampak doživetje. Velja 1 leto, na voljo za vse nivoje tečajev.
            </p>
            <a
              href="#nakup"
              className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
            >
              Kupite darilni bon →
            </a>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <Section>
        <Overline>Za koga je darilni bon?</Overline>
        <SectionHeading className="mb-14 max-w-2xl">
          Štiri razlogi, zakaj je tečaj prostega potapljanja najboljše darilo
        </SectionHeading>

        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          {giftReasons.map((reason) => (
            <div key={reason.title}>
              <h3 className="text-[20px] font-semibold mb-2">
                {reason.title}
              </h3>
              <p className="text-[16px] text-body leading-[1.7] font-body">
                {reason.text}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works + purchase */}
      <Section surface id="nakup">
        <div className="grid md:grid-cols-2 gap-16">
          {/* How it works */}
          <div>
            <Overline>Kako deluje</Overline>
            <SectionHeading className="mb-8">
              Tri koraki do darila
            </SectionHeading>

            <ol className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Izberete tečaj in plačate",
                  text: "Izberete vrsto tečaja (začetni, nadaljevalni ali master) in opravite plačilo.",
                },
                {
                  step: "2",
                  title: "Prejmete digitalni bon",
                  text: "Po plačilu prejmete digitalni bon s kodo po e-pošti — pripravljen za tiskanje ali pošiljanje.",
                },
                {
                  step: "3",
                  title: "Prejemnik se prijavi",
                  text: "Prejemnik se z bon kodo prijavi na izbrani termin tečaja po e-pošti na info@apnea.si. Bon velja 1 leto.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-5 items-start">
                  <span className="text-[28px] font-bold text-gold font-heading leading-none shrink-0 w-8">
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

          {/* Course options */}
          <div className="space-y-4">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
              Izberite tečaj
            </p>

            {(["zacetni", "nadaljevalni", "master"] as const).map((key) => {
              const course = siteConfig.courses[key];
              return (
                <div
                  key={key}
                  className="bg-white p-6 border border-border-custom flex items-center justify-between"
                >
                  <div>
                    <p className="text-[17px] font-medium text-navy font-body">
                      {course.fullName}
                    </p>
                    <p className="text-sm text-muted-text font-body">
                      {course.certification}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[24px] font-bold text-navy font-heading">
                      €{course.price}
                    </p>
                    <button
                      type="button"
                      className="text-gold text-sm font-medium font-body hover:text-gold-hover transition-colors mt-1"
                    >
                      Kupi bon →
                    </button>
                  </div>
                </div>
              );
            })}

            <p className="text-sm text-muted-text font-body mt-4">
              Bon velja 1 leto od nakupa. Vključuje celoten tečaj in SSI
              certifikat.
            </p>
          </div>
        </div>
      </Section>

      {/* What's included */}
      <Section>
        <SectionHeading className="mb-8">
          Kaj je vključeno v darilni bon
        </SectionHeading>
        <div className="max-w-2xl">
          <CheckList
            items={[
              "Celoten tečaj (teorija + bazen + morje)",
              "SSI certifikat ustreznega nivoja",
              "Digitalno učno gradivo v slovenščini",
              "Video analiza potopov",
              "Profesionalno vodstvo in nadzor",
              "Veljavnost 1 leto od nakupa",
            ]}
          />
        </div>
        <p className="mt-8 text-sm text-muted-text font-body">
          Želite bon za nadaljevalni ali master tečaj?{" "}
          <Link
            href="/tecaji"
            className="text-gold hover:text-gold-hover transition-colors"
          >
            Primerjajte tečaje →
          </Link>
        </p>
      </Section>

      <FAQ
        items={faqs}
        overline="Pogosta vprašanja"
        heading="Vprašanja o darilnem bonu"
      />

      {/* Final CTA */}
      <Section surface>
        <div className="text-center max-w-2xl mx-auto">
          <SectionHeading center className="mb-4">
            Darilo, ki si ga zapomnijo za vedno
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            Podarite izkušnjo prostega potapljanja. Prejemnik bo zadržal dih
            več kot 2 minuti, se potopil pod morsko gladino — in vam bo hvaležen
            za vedno.
          </p>
          <a
            href="#nakup"
            className="bg-gold text-white px-10 py-4 text-[16px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors inline-block"
          >
            Kupite darilni bon →
          </a>
        </div>
      </Section>
    </>
  );
}
