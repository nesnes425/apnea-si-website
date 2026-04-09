import Image from "next/image";
import { siteConfig } from "@/lib/config";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { FinalCTA } from "@/components/blocks/FinalCTA";

export const metadata = {
  title: "O nas",
  description:
    "Apnea Slovenija — največja šola prostega potapljanja v Sloveniji. Ustanovljena 2010. Pod vodstvom Sama Jeranka, 10-kratnega svetovnega prvaka.",
};

export default function ONasPage() {
  return (
    <>
      {/* Hero */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <Overline>O nas</Overline>
            <h1 className="text-[34px] md:text-[50px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-6">
              Največja šola prostega potapljanja v Sloveniji
            </h1>
            <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
              Apnea Slovenija od leta 2010 širi ljubezen do prostega
              potapljanja. V zadnjih 15 letih smo naučili več kot 2000 ljudi —
              od popolnih začetnikov, ki so prvič zadrževali dih, do
              tekmovalcev, ki osvajajo medalje na svetovnih prvenstvih.
            </p>
            <p className="text-[17px] text-body leading-[1.7] font-body">
              Delujemo na 5 lokacijah po Sloveniji: Ljubljana, Nova Gorica,
              Velenje, Novo Mesto in Koper. Vsako leto izvedemo tečaje, vodimo
              celoletne treninge in organiziramo tekmovanja.
            </p>
          </div>
          <div className="relative aspect-[4/3]">
            <Image
              src="/images/placeholder/tecaj-skupina.jpg"
              alt="Skupina tečajnikov prostega potapljanja"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <SocialProofBar />

      {/* Samo profile */}
      <Section>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative aspect-[4/5] md:aspect-[3/4]">
            <Image
              src="/images/placeholder/samo-portrait.jpg"
              alt="Samo Jeranko"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <Overline>Ustanovitelj in vodja</Overline>
            <SectionHeading className="mb-6">Samo Jeranko</SectionHeading>
            <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
              Eden najboljših potapljačev na svetu in izkušen inštruktor z
              magisterijem iz strojništva. Tekmuje od leta 2008, poučuje pa že
              več kot 15 let. Združuje analitičen pristop inženirja z
              intuicijo športnika — in zna kompleksne koncepte razložiti
              preprosto in umirjeno.
            </p>
            <p className="text-[17px] text-body leading-[1.7] font-body mb-10">
              Član elitne enote športnikov pri policiji, SSI Instructor Trainer
              (najvišja inštruktorska raven) in ambasador znamke Mares.
            </p>

            <div className="grid grid-cols-2 gap-8 mb-10">
              {[
                { number: "10x", label: "medalja na SP" },
                { number: "2", label: "svetovna rekorda" },
                { number: "19x", label: "državni rekorder" },
                { number: "15x", label: "državni prvak" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border-l-2 border-gold/30 pl-4"
                >
                  <p className="text-[24px] font-bold text-navy font-heading">
                    {stat.number}
                  </p>
                  <p className="text-sm text-muted-text font-body">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <Overline>Dosežki njegovih športnikov</Overline>
            <div className="grid grid-cols-3 gap-6 mt-4">
              {[
                { number: "15+", label: "medalj na SP" },
                { number: "6", label: "svetovnih rekordov" },
                { number: "46", label: "državnih rekordov" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[20px] font-bold text-gold font-heading">
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

      {/* Personal bests */}
      <Section surface>
        <Overline>Osebni rekordi</Overline>
        <SectionHeading className="mb-12">Samo v številkah</SectionHeading>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "-107m", label: "FIM (prosto potapljanje z vrvjo)" },
            { number: "-110m", label: "CWT (konstantna utež)" },
            { number: "8 min", label: "statična apneja" },
            { number: "2008", label: "tekmuje od" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[36px] md:text-[44px] font-bold text-gold font-heading leading-none">
                {stat.number}
              </p>
              <p className="text-sm text-muted-text font-body mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Partnerships */}
      <Section>
        <div className="text-center">
          <Overline>Partnerji in sponzorji</Overline>
          <SectionHeading center className="mb-12">
            Zaupajo nam
          </SectionHeading>

          <div className="flex flex-wrap justify-center gap-12 items-center text-muted-text font-body">
            {["Mares", "SSI", "BTC City", "ELES", "Highfield Boats"].map(
              (partner) => (
                <span
                  key={partner}
                  className="text-[17px] text-navy/40 font-medium"
                >
                  {partner}
                </span>
              )
            )}
          </div>
          <p className="mt-8 text-sm text-muted-text font-body">
            Logotipi partnerjev bodo dodani.
          </p>
        </div>
      </Section>

      {/* TEDx mention */}
      <Section surface>
        <div className="max-w-2xl mx-auto text-center">
          <Overline>TEDx Ljubljana 2025</Overline>
          <SectionHeading center className="mb-6">
            Moč dihanja v zahtevnih trenutkih
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-4">
            Samo je nastopil na TEDx Ljubljana v Gallusovi dvorani Cankarjevega
            doma, kjer je govoril o dihanju kot ključu do uspešnega delovanja v
            zahtevnih situacijah — od tekmovanj do poslovnih izzivov.
          </p>
          <p className="text-sm text-muted-text font-body">
            Video predavanja bo na voljo kmalu.
          </p>
        </div>
      </Section>

      <FinalCTA
        heading="Pridružite se 2000+ potapljačem"
        description="Tečaji od začetnikov do master nivoja. Celoletni treningi na 5 lokacijah."
        buttonText="Tečaji →"
        buttonHref="/tecaji"
      />
    </>
  );
}
