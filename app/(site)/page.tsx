import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { InstagramFeed } from "@/components/blocks/InstagramFeed";
import { LocalBusinessJsonLd } from "@/components/seo/StructuredData";

export default function HomePage() {
  return (
    <>
      <LocalBusinessJsonLd />
      {/* ============================================
          1. HERO — image breathes, text below, CTA
          ============================================ */}
      <section>
        <div className="relative w-full h-[50vh] md:h-[65vh] min-h-[400px] max-h-[600px]">
          <Image
            src="/images/placeholder/hero-samo-underwater.jpg"
            alt="Samo Jeranko med prostim potapljanjem"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <h1 className="text-[36px] md:text-[56px] font-bold leading-[1.05] tracking-[-0.03em] text-navy font-heading max-w-3xl mb-6">
            Odkrijte svet pod gladino
          </h1>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-[17px] md:text-[20px] text-body leading-[1.6] font-body max-w-xl">
              Zadržite dih več kot 2 minuti. Potopite se do 20 metrov.
              Odkrijte mir, ki ga najdete le pod morsko gladino — z največjo
              šolo prostega potapljanja v Sloveniji.
            </p>
            <Button asChild>
              <Link href="/tecaji/zacetni">Rezervirajte mesto →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          3. BEGINNER COURSE — overlapping editorial
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative md:min-h-[560px]">
            {/* Image — takes ~60% width, full height */}
            <div className="relative aspect-[4/3] md:aspect-auto md:absolute md:inset-y-0 md:left-0 md:w-[60%]">
              <Image
                src="/images/placeholder/tecaj-bled.png"
                alt="Tečaj prostega potapljanja"
                fill
                className="object-cover"
              />
            </div>
            {/* Text card — overlaps image from the right */}
            <div className="relative md:ml-auto md:w-[48%] md:my-10 bg-white p-8 md:p-10 shadow-lg">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                Začetni tečaj
              </p>
              <h2 className="text-[26px] md:text-[32px] font-semibold leading-[1.1] tracking-[-0.01em] mb-3">
                Potopite se do 20 metrov na en sam vdih
              </h2>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-5">
                Od prvega zadrževanja diha do samozavestnega potapljanja v
                morju. Teorija, bazen, morje — vse pod vodstvom 10-kratnega
                svetovnega prvaka.
              </p>
              <div className="flex items-baseline gap-4 mb-5">
                <span className="text-[28px] font-bold text-navy font-heading">
                  €{siteConfig.courses.zacetni.price}
                </span>
                <span className="text-sm text-muted-text font-body">
                  SSI Level 1 · vse vključeno
                </span>
              </div>
              <div className="space-y-1.5 mb-6">
                {[
                  "95% udeležencev zadrži dih več kot 2 minuti",
                  "Potopi do 20 metrov v morju",
                  "Majhne skupine — 1 inštruktor na 4",
                ].map((item) => (
                  <p
                    key={item}
                    className="text-[14px] text-body font-body flex gap-3 items-start"
                  >
                    <span className="text-gold shrink-0">✓</span>
                    {item}
                  </p>
                ))}
              </div>
              <Button asChild className="self-start">
                <Link href="/tecaji/zacetni">Več o tečaju →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          4. TRAININGS — overlapping editorial, mirrored
          ============================================ */}
      <section className="pb-20 md:pb-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative md:min-h-[480px]">
            {/* Image — right-aligned, full height */}
            <div className="relative aspect-[4/3] md:aspect-auto md:absolute md:inset-y-0 md:right-0 md:w-[60%]">
              <Image
                src="/images/placeholder/tecaj-bazen-samo.png"
                alt="Trening v bazenu"
                fill
                className="object-cover"
              />
            </div>
            {/* Text card — overlaps image from the left, navy */}
            <div className="relative md:w-[48%] md:my-10 bg-navy p-8 md:p-10 shadow-lg">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                Treningi
              </p>
              <h2 className="text-[26px] md:text-[32px] font-semibold leading-[1.1] tracking-[-0.01em] text-white mb-3">
                350+ potapljačev vsak teden v bazenu
              </h2>
              <p className="text-[16px] text-white/70 leading-[1.7] font-body mb-5">
                Celoletni vodeni treningi na 7 lokacijah po Sloveniji.
                Nekateri trenirajo z nami že 12 let — prišli so na trening,
                ostali so za vedno.
              </p>
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-[28px] font-bold text-gold font-heading">
                  od €54
                </span>
                <span className="text-sm text-white/50 font-body">/mesec</span>
              </div>
              <Button asChild className="self-start">
                <Link href="/treningi">Več o treningih →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          5. TESTIMONIALS — hand-picked Google reviews
          ============================================ */}
      <section className="bg-surface py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body">
              {siteConfig.stats.googleReviews} ocen na Google · {siteConfig.stats.googleRating} ★
            </p>
            <a
              href="https://www.google.com/maps/place/Apnea+Slovenija/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-gold font-medium font-body hover:text-gold-hover transition-colors"
            >
              Preberite vse ocene na Google →
            </a>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { text: "Zelo strokovno izpeljan tečaj. Zelo priporočam. Izveš veliko uporabnih stvari.", name: "Peter Pajk" },
              { text: "Odličen tečaj z vrhunsko ekipo – strokovno, sproščeno in z veliko prakse. Res prava izkušnja, ki jo priporočam vsakemu.", name: "Mitja Mohorič" },
              { text: "Hvala za vso znanje, pomoč in podporo pri srkanju novega znanja pri potopih na vdih. Resnično profesionalci na vseh področjih. Ekipa kapo dol.", name: "david kozjek" },
              { text: "Najboljši tečaj, kar sem ga kadarkoli obiskoval. Samo je izjemen inštruktor.", name: "Aljaž K." },
              { text: "Prišla sem s strahom pred globino. Odšla sem z željo po naslednjem potopu.", name: "Eva Tomazin" },
              { text: "Naučila sem se pravilno dihati — ne le za potapljanje, za življenje. Po tečaju sem se vpisala na treninge.", name: "Nina M." },
            ].map((review, i) => (
              <div
                key={i}
                className="bg-white p-6 border-l-2 border-gold/30"
              >
                <div className="flex gap-0.5 text-gold mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-sm">★</span>
                  ))}
                </div>
                <p className="text-[15px] text-body font-body leading-relaxed mb-4">
                  &ldquo;{review.text}&rdquo;
                </p>
                <p className="text-[13px] text-navy font-medium font-body">
                  {review.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          6. SAMO — quote-led, editorial photo collage
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            {/* Photo collage — large hero + offset accent photos */}
            <div className="relative">
              {/* Main portrait */}
              <div className="relative aspect-[3/4] w-[85%]">
                <Image
                  src="/images/placeholder/samo-portrait.jpg"
                  alt="Samo Jeranko"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Offset accent photos — overlapping bottom-right */}
              <div className="absolute bottom-[-30px] right-[-10px] flex gap-3">
                <div className="relative w-[180px] h-[180px] md:w-[210px] md:h-[210px] shadow-lg">
                  <Image
                    src="/images/placeholder/tedx-samo-23.webp"
                    alt="Samo na TEDx Ljubljana"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative w-[180px] h-[180px] md:w-[210px] md:h-[210px] shadow-lg">
                  <Image
                    src="/images/placeholder/samo-cmas-2025.png"
                    alt="Samo na svetovnem prvenstvu"
                    fill
                    className="object-cover"
                    style={{ objectPosition: "center 20%" }}
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="md:pt-8 mt-8 md:mt-0">
              <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.01em] mb-6 italic font-heading">
                &ldquo;Hotel sem tisto, kar sem občutil na globini, deliti z
                drugimi.&rdquo;
              </h2>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-6">
                <strong className="text-navy">Samo Jeranko</strong> — 10-kratni
                svetovni prvak, 2 svetovna rekorda, SSI Instructor Trainer. V
                zadnjih 15 letih je naučil prostega potapljanja več kot 2000
                ljudi in zgradil največjo šolo v Sloveniji.
              </p>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                Preko{" "}
                <a
                  href="https://freedive-training.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Freedive Training
                </a>{" "}
                usmerja vrhunske potapljače po svetu. Kot{" "}
                <Link
                  href="/predavanja"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  TEDx govornik
                </Link>{" "}
                svoje znanje deli s podjetji in organizacijami.
              </p>
              <Link
                href="/o-nas"
                className="text-[15px] text-gold font-medium font-body hover:text-gold-hover transition-colors"
              >
                Spoznajte našo zgodbo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          7. INSTAGRAM — community invitation via Elfsight
          ============================================ */}
      <section className="bg-surface py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-2">
                Pridružite se nam
              </p>
              <p className="text-[22px] md:text-[26px] font-semibold text-navy font-heading">
                Vstopite v naš svet na Instagramu
              </p>
            </div>
            <a
              href="https://www.instagram.com/apnea.si/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-gold font-medium font-body hover:text-gold-hover transition-colors shrink-0"
            >
              @apnea.si →
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <InstagramFeed />
        </div>
      </section>

      {/* ============================================
          8. LEAD MAGNET — newsletter + free guide, centered
          ============================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
            Brezplačni vodič + novice
          </p>
          <SectionHeading center className="mb-4">
            Prijavite se na novice in prejmite naš najbolj bran vodič
          </SectionHeading>
          <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
            <strong className="text-navy">
              Kako pravilno izenačiti pritisk v ušesih
            </strong>{" "}
            — Valsalva in Frenzel tehnika, razloženi preprosto, korak za
            korakom. Prejmite vodič brezplačno ob prijavi na naše novice.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <label htmlFor="leadmagnet-email" className="sr-only">
              E-pošta
            </label>
            <input
              id="leadmagnet-email"
              type="email"
              placeholder="vas@email.si"
              className="flex-1 border border-border-custom px-4 py-3 text-[15px] font-body text-navy placeholder:text-muted-text focus:outline-none focus:border-gold transition-colors"
            />
            <Button type="button" size="sm" className="py-3">
              Prijavite se →
            </Button>
          </div>
          <p className="text-xs text-muted-text font-body mt-4">
            Brezplačen vodič + novice o tečajih in treningih. Brez spama.
            Odjavite se kadarkoli.
          </p>
        </div>
      </section>
    </>
  );
}
