import Image from "next/image";
import Link from "next/link";
import { FAQ } from "@/components/blocks/FAQ";
import { ContextLinks } from "@/components/blocks/ContextLinks";
import { Overline } from "@/components/blocks/Overline";
import { PhotoGallery } from "@/components/blocks/PhotoGallery";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { Testimonials } from "@/components/blocks/Testimonials";
import { Button } from "@/components/ui/button";
import {
  getTrainingGroups,
  getTrainingSettings,
} from "@/lib/sanity/queries";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { TrainingScheduleSelector } from "./TrainingScheduleSelector";

export const metadata = pageMetadata({
  title: "Treningi prostega potapljanja",
  description:
    "Vodeni treningi plavanja in prostega potapljanja na 7 lokacijah po Sloveniji. Za vse, ki želijo osvojiti tehnike plavanja, napredovati v podvodnem plavanju in ostati povezani z morjem tudi izven poletja.",
  path: "/treningi",
  image: "/images/treningi-hero-v2.webp",
  imageAlt: "Trening prostega potapljanja v bazenu z Apnea Slovenija",
});

export const revalidate = 60;

const reviews = [
  {
    text: "Treningi so postali del mojega tedna, ki ga ne bi zamenjala za nič. Začela sem kot popolna začetnica, danes pa plavam pod vodo 100 metrov in hodim na državna prvenstva. Ekipa je fantastična.",
    name: "Maja L.",
    detail: "Trenira 4 leta, Ljubljana",
  },
  {
    text: "Prišel sem, ker sem hotel izboljšati potapljanje za podvodni ribolov. Ostal sem, ker so treningi postali najboljši del mojega tedna. Ista ekipa, isti bazen, vsak torek.",
    name: "Rok S.",
    detail: "Trenira 3 leta, Koper",
  },
  {
    text: "Po petih letih treningov sem postal inštruktor. Nikoli si nisem mislil, da bom poučeval, ampak treningi ti dajo toliko, da v nekem trenutku želiš to predati naprej.",
    name: "Matevž D.",
    detail: "Inštruktor, 5+ let z nami",
  },
];

const faqs = [
  { q: "Ali moram imeti opravljen začetni tečaj?", a: "Ne. Na treninge se lahko prijavite tudi brez predhodnega tečaja prostega potapljanja." },
  { q: "Koliko znašata članarina in vadnina?", a: "Letna članarina znaša 35 € in se plača ob prijavi. Letna vadnina znaša 56–65 €/mesec za obisk enkrat tedensko, odvisno od lokacije in termina. Vadnina se poravna v dveh obrokih." },
  { q: "Kdaj potekajo treningi?", a: "Sezona: oktober–junij. Termini: jutranji (7:00) in večerni (17:00–22:00), odvisno od lokacije. Podrobne ure so navedene pri vsaki lokaciji." },
  { q: "Kakšno opremo potrebujem?", a: "Potrebujete kratke plavuti, dihalko, športne kopalke, kapo, plavalna očala ali masko ter vratno utež. Performance skupina uporablja tudi dolge plavuti in neoprensko obleko." },
  {
    q: "Ali lahko odpovem udeležbo sredi sezone?",
    a: "Do drugega tedna trajanja programa lahko odpoveste udeležbo na treningih in vrnemo vam celotno vadnino, če je ta že bila plačana. Članarina se ne vrača. Če s treningi ne morete nadaljevati, lahko udeležbo odpoveste do osmega tedna trajanja programa. V tem primeru ste oproščeni plačila drugega obroka letne vadnine. Če ste vadnino poravnali v celotnem znesku, vam vrnemo 40 % letne vadnine. Zaradi narave vadbe in hitrega napredka novih udeležencev po osmem tednu ne moremo več sprejemati v skupino, saj bi s tem zavirali napredek preostalih članov. Zato pri poznejši odpovedi oprostitev plačila drugega dela vadnine oziroma vračilo ni več mogoče.",
  },
  { q: "Zanima me predvsem plavanje. Ali so treningi primerni?", a: "Da. Treningi združujejo plavanje in prosto potapljanje, zato so začetne in nadaljevalne skupine primerne tudi za ljudi, ki želijo predvsem izboljšati plavalno tehniko." },
  { q: "Kdo vodi treninge?", a: "Izkušeni trenerji plavanja in inštruktorji prostega potapljanja. Program zasnuje Samo Jeranko. V skupini je povprečno manj kot 5 udeležencev na progo." },
  { q: "Ali so organizirani tudi globinski treningi?", a: "Da. Konec maja organiziramo tradicionalni Apnea.si Training Camp, ki je namenjen globinskim potopom. Pogoj za udeležbo je opravljen začetni tečaj." },
];

const trainingPhotos = [
  { src: "/images/treningi-galerija-1.webp", alt: "Trening v bazenu", aspect: 1.5 },
  { src: "/images/treningi-galerija-2.webp", alt: "Trening camp", aspect: 1.5 },
  { src: "/images/treningi-galerija-3.webp", alt: "Skupina na treningu", aspect: 1.5 },
  { src: "/images/treningi-galerija-4.webp", alt: "Trening na prostem", aspect: 1.5 },
  { src: "/images/treningi-galerija-5.webp", alt: "Prosto potapljanje", aspect: 1.5 },
  { src: "/images/treningi-galerija-6.webp", alt: "Trening prostega potapljanja", aspect: 1.5 },
  { src: "/images/treningi-galerija-7.webp", alt: "Vadba v bazenu", aspect: 1.5 },
  { src: "/images/treningi-galerija-8.webp", alt: "Skupinski trening", aspect: 1.5 },
  { src: "/images/treningi-galerija-9.webp", alt: "Prosto potapljanje v bazenu", aspect: 1.5 },
];

export default async function TreningiPage() {
  const [settings, groups] = await Promise.all([
    getTrainingSettings(),
    getTrainingGroups(),
  ]);
  const applicationsOpen = settings?.applicationsOpen ?? false;
  const membershipFee = settings?.membershipFee ?? siteConfig.trainings.membership.price;

  return (
    <>
      <section className="relative flex min-h-[520px] w-full items-center md:min-h-[600px]">
        <Image
          src="/images/treningi-hero-v2.webp"
          alt="Trening prostega potapljanja v bazenu"
          fill
          className="object-cover"
          style={{ objectPosition: "85% center" }}
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[40%] via-white/80 via-[55%] to-transparent to-[75%]" />
        <div className="absolute inset-0 bg-white/60 md:hidden" />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-lg">
            <Overline>Treningi plavanja in prostega potapljanja</Overline>
            <h1 className="mb-5 text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-navy md:text-[50px]">
              Postanite boljši plavalci in uspešni prosti potapljači
            </h1>
            <p className="mb-3 text-[17px] leading-[1.6] text-body md:text-[19px]">
              Želite izboljšati plavalne veščine, podaljšati čas plavanja pod
              vodo in ostati v stiku z vodo? Treningi prostega potapljanja so
              ravno to: tedenska vodena vadba za popolne začetnike in vrhunske
              proste potapljače!
            </p>
            <p className="mb-8 text-[20px] font-semibold text-navy md:text-[22px]">
              od 56 €/mesec
            </p>
            <Button asChild>
              <a href="#prijava">Izberite lokacijo in termin →</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-gold-pale py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium text-navy">
            {applicationsOpen
              ? `Prijave za sezono ${settings?.seasonLabel ?? ""} so odprte.`
              : "Spletne prijave so trenutno zaprte. Za vključitev med sezono nam pišite na info@apnea.si."}
          </p>
          <a
            href={applicationsOpen ? "#prijava" : `mailto:${siteConfig.email}?subject=Prijava na treninge`}
            className="shrink-0 text-[14px] font-medium text-gold transition-colors hover:text-gold-hover"
          >
            {applicationsOpen ? "Prijavite se →" : "Pišite nam →"}
          </a>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <Overline>Kako je na treningu</Overline>
              <SectionHeading className="mb-6">Začnete zaradi morja. Ostanete zaradi napredka.</SectionHeading>
              <p className="mb-6 text-[17px] leading-[1.7] text-body">
                Nekateri pridejo po koncu poletja, saj ne želijo, da je prosto
                potapljanje le enkratna poletna izkušnja. Drugim je klasično
                plavanje preveč monotono ali pa želijo izboljšati kondicijo za
                podvodni ribolov ali surfanje. Tretji iščejo vadbo, ki jim bo
                pomagala najti mir pod vodno gladino.
              </p>
              <p className="mb-8 text-[17px] leading-[1.7] text-body">
                Potem se zgodi nekaj najlepšega: napredek postane zelo konkreten.
                Prvih 25 metrov pod vodo, nato 50, potem še več. Boljša tehnika,
                daljše lagodje, učinkovitejše dihanje, več samozaupanja. In ker
                se vsak teden srečujete z istimi ljudmi, trening postane tudi
                trenutek za druženje.
              </p>
              <div className="border-l-2 border-gold/40 pl-4">
                <p className="text-[15px] italic leading-relaxed text-navy/60">
                  &ldquo;Začela sem kot popolna začetnica. Danes plavam 150 metrov
                  pod vodo brez plavuti in pomagam voditi treninge.&rdquo;
                </p>
                <p className="mt-1 text-[13px] text-muted-text">Polona, trenerka, 8 let z nami</p>
              </div>
            </div>
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/treningi-kako-je-na-treningu.webp"
                alt="Trening prostega potapljanja"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-20 md:py-28" id="programi">
        <div className="mx-auto max-w-6xl px-6">
          <Overline>Programi</Overline>
          <SectionHeading className="mb-6 max-w-2xl">Program za vse ravni znanja</SectionHeading>
          <p className="mb-4 max-w-2xl text-[17px] leading-[1.7] text-body">
            Ob prijavi izberete skupino glede na svoje izkušnje in cilje. Če še
            ne obvladate prsne in kravl tehnike, vam svetujemo začetno skupino.
            Če že dobro plavate, lahko izberete nadaljevalno skupino. Če vas
            zanimajo predvsem dolgi potopi, lahko izberete performance program.
          </p>
          <p className="mb-14 max-w-2xl border-l-4 border-gold pl-6 text-[15px] font-medium text-navy">
            Izjema: če ste v preteklosti aktivno trenirali plavanje, se lahko ob
            prijavi vključite v nadaljevalno skupino.
          </p>
          <div className="max-w-3xl space-y-6">
            {[
              { step: "1", title: "Začetni program", who: "Od osnov plavanja do dolgih potopov", what: "Tehnika plavanja, osnove zadrževanja diha in postopno privajanje na gibanje pod vodo. V prvem delu sezone je poudarek na učenju prsne in kravl tehnike, nato pa na privajanju na daljše potope. Po eni ali dveh sezonah lahko napredujete v nadaljevalno skupino." },
              { step: "2", title: "Nadaljevalni program", who: "Za dobre plavalce", what: "Izboljšanje tehnik plavanja s poudarkom na plavalni kondiciji in daljših serijah podvodnega plavanja. Skupina je primerna za tiste z dobrim znanjem kravl in prsne tehnike ter izkušnjami s plavalnim treningom ali športnim prostim potapljanjem." },
              { step: "3", title: "Performance program", who: "Za izkušene potapljače in tekmovalce", what: "Daljši potopi s plavutmi in brez njih, intenzivnejše serije za napredek v O₂ in CO₂ vzdržljivosti ter bolj individualno spremljanje napredka. Program je pogosta izbira pri treningu dvakrat tedensko. Uporabljamo napredno opremo za prosto potapljanje, kot so neopren in daljše plavuti." },
              { step: "4", title: "Statična apneja", who: "Statično zadrževanje sape v mirovanju", what: "Sprostitvene tehnike, prilagajanje na CO₂ in podaljševanje zadrževanja sape v mirovanju. Svetujemo v kombinaciji s katerim koli drugim treningom." },
            ].map((program) => (
              <div key={program.step} className="flex items-start gap-6 border-b border-border-custom pb-6">
                <span className="w-10 shrink-0 text-[36px] font-bold leading-none text-gold/30">{program.step}.</span>
                <div>
                  <h3 className="mb-1 text-[20px] font-semibold">{program.title}</h3>
                  <p className="mb-2 text-[14px] font-medium text-gold">{program.who}</p>
                  <p className="text-[15px] leading-[1.6] text-body">{program.what}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Testimonials reviews={reviews} overline="Naši člani" heading="Zakaj ostanejo" />

      <section className="bg-surface py-20 md:py-28" id="prijava">
        <div className="mx-auto max-w-6xl px-6">
          <Overline>Lokacije in urnik</Overline>
          <SectionHeading className="mb-4">Kje in kdaj potekajo treningi</SectionHeading>
          <p className="mb-12 max-w-3xl text-[17px] leading-[1.7] text-body">
            Izberite lokacijo in bazen, nato poiščite ustrezno skupino. Mesto v
            skupini rezervirate s plačilom letne članarine v višini{" "}
            {membershipFee} €.
          </p>
          <p className="-mt-6 mb-12 max-w-3xl text-[15px] leading-[1.7] text-muted-text">
            Niste prepričani glede ravni, opreme ali prijave? Poglejte{" "}
            <Link
              href="/vprasanja"
              className="text-gold hover:text-gold-hover transition-colors"
            >
              FAQ
            </Link>
            .
          </p>
          <TrainingScheduleSelector groups={groups} applicationsOpen={applicationsOpen} membershipFee={membershipFee} />
        </div>
      </section>

      <section className="py-12">
        <PhotoGallery photos={trainingPhotos} />
      </section>

      <FAQ items={faqs} surface />
      <ContextLinks surface>
        Za širša vprašanja o tečajih, opremi in začetku prostega potapljanja
        odprite še{" "}
        <Link
          href="/vprasanja"
          className="text-gold hover:text-gold-hover transition-colors"
        >
          celoten FAQ →
        </Link>
      </ContextLinks>

      <section className="bg-navy py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-6 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-white md:text-[40px]">
            Naj prosto potapljanje postane več kot le enkratno poletno doživetje!
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-[18px] text-white/60">
            Za napredek potrebujete več kot le občasno potapljanje na morju. Z
            rednim treningom, izkušenim trenerjem in dobro družbo je vsaka vadba
            novo doživetje!
          </p>
          <Button asChild size="xl">
            <a href="#prijava">Poiščite svojo skupino →</a>
          </Button>
        </div>
      </section>
    </>
  );
}
