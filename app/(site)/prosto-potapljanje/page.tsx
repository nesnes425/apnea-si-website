import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { LocalBusinessJsonLd, PersonSamoJsonLd } from "@/components/seo/StructuredData";

const SITE_URL = "https://apnea.si";

export const metadata: Metadata = {
  title: "Prosto potapljanje, potapljanje na vdih in potapljanje na dah",
  description:
    "Kaj je prosto potapljanje oziroma potapljanje na vdih, kaj se dogaja v telesu pod vodo, kako začeti varno in zakaj je znanje nujno tudi za podvodni ribolov.",
  alternates: { canonical: "/prosto-potapljanje" },
  openGraph: {
    title: "Prosto potapljanje, potapljanje na vdih in potapljanje na dah",
    description:
      "Izčrpen vodnik Apnea.si: fiziologija, izenačevanje, varnost, discipline, podvodni ribolov in prvi koraki v prostem potapljanju.",
    url: `${SITE_URL}/prosto-potapljanje`,
    type: "article",
  },
};

const physiologyFacts = [
  {
    title: "Srčni utrip se upočasni",
    text: "Ko obraz pride v stik z vodo in zadržite dih, se pri večini ljudi sproži potapljaški odziv. Eden od njegovih najbolj znanih učinkov je bradikardija: srce začne utripati počasneje, zato telo porabi manj kisika.",
  },
  {
    title: "Kri se preusmeri k pomembnim organom",
    text: "Žile v okončinah se zožijo, več krvi pa ostane na voljo možganom, srcu in pljučem. Telo se ob potopu obnaša varčneje, kot bi se na suhem.",
  },
  {
    title: "Pljuča se ne obnašajo kot balon",
    text: "Dolgo so domnevali, da se človeška pljuča pod približno 50 metri preprosto ne morejo več varno stisniti. Globinski potopi pionirjev prostega potapljanja so pokazali, da telo tlak prenaša bolj kompleksno, med drugim z elastičnostjo prsnega koša in krvnim premikom.",
  },
  {
    title: "Vranica lahko prispeva dodatno rezervo",
    text: "Pri daljšem zadrževanju diha se lahko vranica skrči in v kri sprosti del zaloge rdečih krvničk. To ni čarovnija in ne nadomesti treninga, je pa eden od zanimivih razlogov, zakaj je človeško telo za potop bolje opremljeno, kot si večina predstavlja.",
  },
];

const disciplines = [
  {
    name: "Statična apnea",
    description: "Zadrževanje diha v mirovanju, običajno na vodni gladini. Tu ne šteje globina, temveč mirnost, sprostitev in čas.",
  },
  {
    name: "Dinamična apnea",
    description: "Plavanje pod vodo v bazenu. Lahko poteka s plavutmi, mono plavutjo ali brez plavuti.",
  },
  {
    name: "Globinsko prosto potapljanje",
    description: "Potop ob vrvi v morju ali jezeru. Najbolj znane discipline so stalna obtežitev, potop brez plavuti in prosti potop z vlečenjem po vrvi.",
  },
  {
    name: "Rekreativno prosto potapljanje",
    description: "Najpogostejša oblika: raziskovanje morja, potopi ob obali, podvodni ribolov, fotografija, školjke, razbitine in občutek svobode pod gladino.",
  },
];

const misconceptions = [
  {
    q: "Ali me morajo pri potopu boleti ušesa?",
    a: "Ne. Bolečina v ušesih ni normalen del prostega potapljanja, ampak znak, da tlaka niste pravočasno izenačili. Na tečaju se naučite tehnik izenačevanja, predvsem pravilnega in pravočasnega dela z jezikom, mehkim nebom in zrakom v ustni votlini.",
  },
  {
    q: "Ali moram znati dolgo zadržati dih, preden pridem na tečaj?",
    a: "Ne. Veliko ljudi pride z občutkom, da ne zmorejo niti deset sekund. Ko se naučijo umiriti telo, dihati pred potopom in se pod vodo gibati brez panike, hitro ugotovijo, da so njihove sposobnosti precej večje, kot so mislili.",
  },
  {
    q: "Ali je na 100 metrih popolna tema?",
    a: "Ne nujno. Svetlobe je seveda veliko manj kot pri gladini, barve hitro izginejo in vse postane modro, vendar ob dobri vidljivosti in močnem soncu globina tudi prek 100 metrov ni nujno popolna črnina. Ravno ta modra tišina je del izkušnje globinskega potopa.",
  },
  {
    q: "Ali je prosto potapljanje nevarno?",
    a: "Lahko je nevarno, če ga izvajate sami, brez znanja ali s slabimi navadami, na primer s hiperventilacijo. Z dobrim tečajem, pravilnim varovanjem in postopnim treningom pa postane urejena veščina, ne ugibanje.",
  },
];

function ArticleJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Prosto potapljanje, potapljanje na vdih in potapljanje na dah",
          description: metadata.description,
          inLanguage: "sl",
          author: {
            "@type": "Organization",
            name: "Apnea Slovenija",
            url: SITE_URL,
          },
          publisher: {
            "@type": "Organization",
            name: "Apnea Slovenija",
            url: SITE_URL,
          },
          mainEntityOfPage: `${SITE_URL}/prosto-potapljanje`,
        }),
      }}
    />
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-gold hover:text-gold-hover transition-colors"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export default function ProstoPotapljanjePage() {
  return (
    <>
      <LocalBusinessJsonLd />
      <PersonSamoJsonLd />
      <ArticleJsonLd />

      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <Image
          src="/images/prosto-potapljanje-hero.webp"
          alt="Prosto potapljanje v modrini"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20" />
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl">
            <Overline>Vodnik po prostem potapljanju</Overline>
            <h1 className="text-[40px] md:text-[58px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-6 font-heading">
              Prosto potapljanje: kaj se zgodi, ko se pod vodo zanesete samo na en vdih
            </h1>
            <p className="text-[18px] md:text-[20px] text-body leading-[1.65] font-body mb-8">
              Prosto potapljanje, potapljanje na vdih ali potapljanje na dah je najčistejši stik z vodo. Ni jeklenk, ni hrupa regulatorja in ni občutka, da ste gost v tujem svetu. Pod gladino greste s svojim telesom, svojim dihom in znanjem, ki odloči, ali bo potop napet ali miren.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="xl">
                <Link href="/tecaji/zacetni">Začnite z začetnim tečajem →</Link>
              </Button>
              <Link
                href="/treningi"
                className="inline-flex items-center px-2 py-4 text-[16px] font-medium text-gold hover:text-gold-hover transition-colors font-body"
              >
                Poglejte treninge →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section maxWidth="narrow">
        <p className="text-[21px] text-navy leading-[1.7] font-heading mb-8">
          Večina ljudi misli, da je prosto potapljanje rezervirano za posebne ljudi: za tiste, ki imajo izjemna pljuča, jeklene živce ali prirojen talent za globino. V resnici se prvi napredek pogosto zgodi takrat, ko ne poskušate biti močnejši, ampak mirnejši.
        </p>
        <div className="space-y-6 text-[17px] text-body leading-[1.8] font-body">
          <p>
            Ko se naučite sprostiti, pravilno izenačevati tlak, uporabljati plavuti in razumeti, kaj telo počne med zadrževanjem diha, se morje spremeni. Kar je bilo prej samo površina, postane prostor, v katerega lahko vstopite. Lahko se potopite do školjke, mirno opazujete ribo, zaplavate ob razbitini ali se pri podvodnem ribolovu odločate bolj preudarno.
          </p>
          <p>
            Zato prosto potapljanje ni samo tekmovanje v globini ali minutah. Je uporabna veščina za ljudi, ki imajo radi morje, in hkrati šport z izjemno zanimivo fiziologijo. Človeško telo se pod vodo ne obnaša tako, kot bi pričakovali na suhem.
          </p>
        </div>
      </Section>

      <Section surface>
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
          <div>
            <Overline>Kaj pomeni</Overline>
            <SectionHeading className="mb-6">
              Prosto potapljanje, potapljanje na vdih in potapljanje na dah
            </SectionHeading>
            <p className="text-[17px] text-body leading-[1.75] font-body">
              V Sloveniji boste slišali vse tri izraze. Prosto potapljanje je bolj športen in strokoven izraz. Potapljanje na vdih natančno pove, da se potapljate z enim vdihom. Potapljanje na dah je pogovorni izraz, ki ga veliko ljudi še vedno uporablja, predvsem ob morju.
            </p>
          </div>
          <div className="bg-white border border-border-custom p-8 md:p-10">
            <h2 className="text-[26px] font-semibold text-navy font-heading mb-5">
              Skupna ideja je preprosta
            </h2>
            <p className="text-[17px] text-body leading-[1.75] font-body mb-6">
              Pred potopom vdihnete na površini, nato pa se pod vodo gibate brez dihalnega aparata. To pomeni, da morate znati zrak porabljati pametno, pritisk izenačevati pravočasno in se vrniti na površino z dovolj rezerve.
            </p>
            <CheckList
              items={[
                "En vdih, brez jeklenk",
                "Mirno gibanje in dobra tehnika",
                "Pravočasno izenačevanje tlaka",
                "Potapljanje vedno z varovanjem",
              ]}
              columns={2}
            />
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <Overline>Fiziologija</Overline>
            <SectionHeading className="mb-6">
              Sesalski potapljaški odziv: zakaj telo pod vodo ni pasivno
            </SectionHeading>
            <div className="space-y-6 text-[17px] text-body leading-[1.8] font-body">
              <p>
                Ko zadržite dih in obraz potopite v vodo, se sproži skupek odzivov, ki jih imenujemo sesalski potapljaški odziv. To ni ezoterika, ampak dobro opisana fiziologija: srčni utrip se upočasni, krvne žile v okončinah se zožijo, telo pa poskuša kisik ohraniti za organe, ki ga najbolj potrebujejo.
              </p>
              <p>
                Pri začetnikih so ti odzivi blagi. Pri izkušenih potapljačih, ki so sproščeni in vajeni zadrževanja diha, postanejo izrazitejši. To ne pomeni, da je človek narejen za nepremišljene potope. Pomeni pa, da telo ni nemočno, ko se znajde pod gladino.
              </p>
            </div>
          </div>
          <div className="space-y-5">
            {physiologyFacts.map((fact) => (
              <div key={fact.title} className="border border-border-custom p-6">
                <h3 className="text-[21px] font-semibold text-navy font-heading mb-3">
                  {fact.title}
                </h3>
                <p className="text-[15px] text-body leading-[1.7] font-body">
                  {fact.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section surface maxWidth="narrow">
        <Overline>Izenačevanje</Overline>
        <SectionHeading className="mb-6">
          Ušesa pri pravilnem potopu ne smejo boleti
        </SectionHeading>
        <div className="space-y-6 text-[17px] text-body leading-[1.8] font-body">
          <p>
            Ena najpogostejših napačnih predstav je, da so boleča ušesa normalen del potapljanja. Niso. Bolečina pomeni, da tlak v srednjem ušesu ni izenačen s tlakom okolice. Če nadaljujete potop, ko vas uho že boli, ne trenirate vzdržljivosti, ampak tvegate poškodbo.
          </p>
          <p>
            Dobro izenačevanje se začne pred bolečino. Pri prostem potapljanju je to še pomembnejše kot pri potapljanju z jeklenko, ker se spuščate hitreje in imate samo zrak, ki ste ga prinesli s površine. Zato se na tečaju veliko časa posveti tehnikam izenačevanja, položaju glave, sprostitvi vratu in občutku, kdaj se potop ustavi.
          </p>
          <p>
            Ko je tehnika pravilna, se pritisk ne doživlja kot boj. Potop postane tišji, bolj tekoč in precej bolj prijeten.
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-[1fr_0.85fr] gap-14 items-start">
          <div>
            <Overline>Wow faktor</Overline>
            <SectionHeading className="mb-6">
              Kako daleč gre lahko človeško telo?
            </SectionHeading>
            <div className="space-y-6 text-[17px] text-body leading-[1.8] font-body">
              <p>
                Rekordi niso cilj začetnega tečaja, so pa dober opomnik, kako napačna je predstava, da se človek pod vodo takoj znajde na robu svojih zmožnosti. Tekmovalci so v disciplinah prostega potapljanja dosegli globine, razdalje in čase, ki so se še pred nekaj desetletji zdeli nemogoči.
              </p>
              <p>
                Po trenutnih AIDA podatkih je moški rekord v globinski disciplini stalne obtežitve 136 metrov, najdaljša moška dinamična apnea s plavutmi pa 319 metrov. V statični apnei je AIDA moški rekord 11 minut in 35 sekund, Guinnessov rekord z vnaprejšnjim dihanjem kisika pa je 29 minut in 3 sekunde. Med ženskami so številke prav tako izjemne: v AIDA tabeli je stalna obtežitev pri 123 metrih, dinamična apnea s plavutmi pa pri 280 metrih.
              </p>
              <p>
                Ti podatki niso navodilo za posnemanje. So dokaz, da je prosto potapljanje resen šport, v katerem se srečajo fiziologija, tehnika, trening in velika mera samopoznavanja. Za večino ljudi je najpomembnejši prvi preskok precej bližje: ugotoviti, da se lahko pod vodo sprostijo in premaknejo veliko bolj mirno, kot so pričakovali.
              </p>
            </div>
          </div>
          <div className="bg-navy text-white p-8 md:p-10">
            <p className="text-[13px] uppercase tracking-[0.08em] text-gold font-body mb-4">
              Rekordi se spreminjajo
            </p>
            <p className="text-[16px] text-white/80 leading-[1.7] font-body mb-6">
              Številke na tej strani so orientacijske in preverjene junija 2026. Za aktualno stanje vedno preverite uradne tabele organizacij.
            </p>
            <div className="space-y-3 text-[15px] font-body">
              <p>
                <SourceLink href="https://www.aidainternational.org/">AIDA world records</SourceLink>
              </p>
              <p>
                <SourceLink href="https://www.cmas.org/document/freediving/freediving-world-records.html">CMAS freediving records</SourceLink>
              </p>
              <p>
                <SourceLink href="https://www.guinnessworldrecords.com/world-records/longest-time-breath-held-voluntarily-%28male%29">Guinness breath-hold record</SourceLink>
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section surface>
        <Overline>Discipline</Overline>
        <SectionHeading className="mb-6 max-w-2xl">
          Prosto potapljanje ni ena sama disciplina
        </SectionHeading>
        <p className="text-[17px] text-body leading-[1.75] font-body max-w-3xl mb-12">
          Nekdo pride zaradi morja, drugi zaradi podvodnega ribolova, tretji zaradi bazenskega treninga ali tekmovanj. Dobro je razumeti razliko, ker vsaka oblika zahteva malo drugačne navade.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {disciplines.map((discipline) => (
            <div key={discipline.name} className="bg-white border border-border-custom p-7">
              <h3 className="text-[23px] font-semibold text-navy font-heading mb-3">
                {discipline.name}
              </h3>
              <p className="text-[16px] text-body leading-[1.7] font-body">
                {discipline.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-2 gap-14 items-start">
          <div className="relative aspect-[3/4]">
            <Image
              src="/images/prosto-potapljanje-ribolov.webp"
              alt="Potapljanje na vdih v morju"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <Overline>Podvodni ribolov</Overline>
            <SectionHeading className="mb-6">
              Zakaj je znanje prostega potapljanja nujno za podvodne ribiče
            </SectionHeading>
            <div className="space-y-6 text-[17px] text-body leading-[1.8] font-body">
              <p>
                Podvodni ribolov je eden najpogostejših razlogov, zakaj se ljudje začnejo zanimati za potapljanje na vdih. To je razumljivo: boljša tehnika pomeni mirnejši spust, manj porabe kisika, boljši položaj v vodi in več nadzora pri odločitvah.
              </p>
              <p>
                Prav pri podvodnem ribolovu pa je znanje varnosti še posebej pomembno. Potapljač je osredotočen na okolico, ribo, tok, opremo in odločitev, ali bo ostal še nekaj sekund. Če nima dobrih navad, se lahko ravno tam začnejo težave.
              </p>
              <p>
                Tečaj prostega potapljanja ne naredi iz nikogar boljšega ribiča čez noč. Vam pa da osnovo, ki jo podvodni ribič potrebuje: izenačevanje, tehniko plavanja, razumevanje utrujenosti, pravilno varovanje in spoštovanje rezerve, s katero se mora končati vsak potop.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section surface>
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-14 items-start">
          <div>
            <Overline>Prvi koraki</Overline>
            <SectionHeading className="mb-6">
              Kako začeti, če vas prosto potapljanje zanima
            </SectionHeading>
            <p className="text-[17px] text-body leading-[1.75] font-body">
              Najboljši začetek ni samostojno preizkušanje meja v morju. Najboljši začetek je dober tečaj, kjer se naučite, kaj se v telesu dogaja, kako se pravilno pripraviti na potop in kako varovati drugega potapljača.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white border border-border-custom p-7">
              <h3 className="text-[23px] font-semibold text-navy font-heading mb-3">
                Če še nimate osnove
              </h3>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                Začetni tečaj je namenjen temu, da varno zgradite temelj: dihanje, sprostitev, izenačevanje, tehniko plavanja in prve globinske potope.
              </p>
              <Button asChild>
                <Link href="/tecaji/zacetni">Začetni tečaj →</Link>
              </Button>
            </div>
            <div className="bg-white border border-border-custom p-7">
              <h3 className="text-[23px] font-semibold text-navy font-heading mb-3">
                Če želite redno napredovati
              </h3>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                Treningi so za ljudi, ki želijo prosto potapljanje obdržati v življenju: tehnika, kondicija, skupina, napredek in priprava na morje.
              </p>
              <Link
                href="/treningi"
                className="inline-flex text-[15px] font-medium text-gold hover:text-gold-hover transition-colors font-body"
              >
                Treningi →
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <Overline>Pogosta vprašanja</Overline>
        <SectionHeading className="mb-10 max-w-2xl">
          Kaj ljudje pogosto narobe razumejo
        </SectionHeading>
        <div className="grid md:grid-cols-2 gap-6">
          {misconceptions.map((item) => (
            <div key={item.q} className="border border-border-custom p-7">
              <h3 className="text-[21px] font-semibold text-navy font-heading mb-3">
                {item.q}
              </h3>
              <p className="text-[16px] text-body leading-[1.7] font-body">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section surface maxWidth="narrow">
        <Overline>Viri in nadaljnje branje</Overline>
        <SectionHeading className="mb-6">
          Koristni viri za preverjanje dejstev
        </SectionHeading>
        <div className="space-y-4 text-[16px] text-body leading-[1.7] font-body">
          <p>
            Za aktualne rekorde preverite <SourceLink href="https://www.aidainternational.org/">AIDA</SourceLink> in <SourceLink href="https://www.cmas.org/document/freediving/freediving-world-records.html">CMAS</SourceLink>. Guinnessov rekord za najdaljše zadrževanje diha pod vodo z vnaprejšnjim dihanjem kisika je objavljen v bazi <SourceLink href="https://www.guinnessworldrecords.com/world-records/longest-time-breath-held-voluntarily-%28male%29">Guinness World Records</SourceLink>.
          </p>
          <p>
            Za fiziologijo potapljaškega odziva je dober izhodiščni vir pregled <SourceLink href="https://www.ncbi.nlm.nih.gov/sites/books/NBK538245/">NCBI Bookshelf: Physiology, Diving Reflex</SourceLink>.
          </p>
          <p>
            Če želite izvedeti več o Samu Jeranku, njegovih rezultatih in ekipi Apnea.si, preberite stran <Link href="/o-nas" className="text-gold hover:text-gold-hover transition-colors">O nas</Link>.
          </p>
        </div>
      </Section>

      <section className="relative w-full py-24 md:py-32">
        <Image
          src="/images/prosto-potapljanje-pod-gladino.webp"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6 font-heading">
            Najlepši potop se začne veliko pred gladino
          </h2>
          <p className="text-[18px] md:text-[20px] text-white/75 font-body mb-10 max-w-2xl mx-auto leading-[1.7]">
            Če želite prosto potapljanje spoznati pravilno, začnite z osnovami. Če jih že imate, vam redni treningi pomagajo, da napredek ne ostane samo poletna želja.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="xl">
              <Link href="/tecaji/zacetni">Začetni tečaj →</Link>
            </Button>
            <Link
              href="/treningi"
              className="inline-flex items-center px-2 py-4 text-[16px] font-medium text-gold hover:text-gold-hover transition-colors font-body"
            >
              Treningi →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
