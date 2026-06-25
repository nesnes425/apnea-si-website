import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { FAQPageJsonLd } from "@/components/seo/StructuredData";

const answerLinkClassName = "text-gold hover:text-gold-hover transition-colors";

export const metadata = pageMetadata({
  title: "Pogosta vprašanja",
  description:
    "Odgovori na pogosta vprašanja o tečajih prostega potapljanja, treningih, darilnih bonih in opremi. Apnea Slovenija.",
  path: "/vprasanja",
  imageAlt: "Pogosta vprašanja Apnea Slovenija",
});

const sections = [
  {
    id: "tecaji",
    title: "Tečaji",
    description: "Prijava, plačilo, oprema, potek",
    faqs: [
      {
        q: "Kako poteka prijava na tečaj prostega potapljanja?",
        a: "Na tečaj se prijavite preko obrazca na strani Tečaji. Ob tem izberete nivo, termin teoretičnega dela in termin praktičnega dela tečaja. Na vašo prijavo bomo odgovorili v najkrajšem možnem času.",
        content: (
          <>
            Na tečaj se prijavite preko obrazca na strani{" "}
            <Link href="/tecaji" className={answerLinkClassName}>
              Tečaji
            </Link>
            . Ob tem izberete nivo, termin teoretičnega dela in termin
            praktičnega dela tečaja. Na vašo prijavo bomo odgovorili v
            najkrajšem možnem času.
          </>
        ),
      },
      { q: "Kdaj je moja prijava potrjena?", a: "Vaša prijava je potrjena po plačilu akontacije v višini 50 €. Podatke vam bomo posredovali v odgovoru na vašo prijavo. Akontacija se ne vrača, saj vključuje naročilo učnega gradiva in rezervacijo mesta na tečaju." },
      { q: "Kdaj je potrebno plačati prijavnino na tečaj?", a: "Skupaj s podatki za nakazilo akontacije prejmete tudi račun za plačilo preostanka cene tečaja. Ta se poravna najkasneje 10 delovnih dni pred pričetkom tečaja. V kolikor potekajo akcije z ugodnostmi, je potrebno celotno prijavnino poravnati do konca akcije, saj v nasprotnem primeru izgubite možnost koriščenja ugodnosti." },
      {
        q: "Imam darilni bon, kako poteka prijava v tem primeru?",
        a: "Ob prejemu bona je najbolje, da se kar se da kmalu javite na email info@apnea.si ter sporočite, kateri termin tečaja vam najbolj odgovarja. Zaradi hitrega polnjenja mest je pametno, da si prosto mesto rezervirate čim prej. S tem je vaša prijava potrjena.",
        content: (
          <>
            Ob prejemu bona je najbolje, da se kar se da kmalu javite na email{" "}
            <a href="mailto:info@apnea.si" className={answerLinkClassName}>
              info@apnea.si
            </a>{" "}
            ter sporočite, kateri termin tečaja vam najbolj odgovarja. Zaradi
            hitrega polnjenja mest je pametno, da si prosto mesto rezervirate
            čim prej. S tem je vaša prijava potrjena.
          </>
        ),
      },
      {
        q: "Kdaj prejmem učno gradivo?",
        a: "Učno gradivo prejmete, ko je vaša prijava na tečaj potrjena. Zanj se je potrebno prijaviti na povezavi mySSI.",
        content: (
          <>
            Učno gradivo prejmete, ko je vaša prijava na tečaj potrjena. Zanj se
            je potrebno prijaviti na povezavi{" "}
            <a
              href="https://my.divessi.com/register"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              mySSI
            </a>
            .
          </>
        ),
      },
      {
        q: "Kako najlažje prebiram učno gradivo?",
        a: "Interaktivno učno gradivo boste najlažje prebirali s pomočjo aplikacije mySSI za Android in iOS pametne telefone ter tablice. Vanjo se vpišete z istimi podatki, kot ste jih uporabili pri registraciji v sistem SSI.",
        content: (
          <>
            Interaktivno učno gradivo boste najlažje prebirali s pomočjo
            aplikacije mySSI za{" "}
            <a
              href="https://play.google.com/store/apps/details?id=com.divessi.ssi&hl=en"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Android
            </a>{" "}
            in{" "}
            <a
              href="https://apps.apple.com/us/app/myssi/id1249389209"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              iOS
            </a>{" "}
            pametne telefone ter tablice. Vanjo se vpišete z istimi podatki, kot
            ste jih uporabili pri registraciji v sistem SSI.
          </>
        ),
      },
      { q: "Ali za tečaj potrebujem zdravstveno izjavo zdravnika?", a: "Pred pričetkom tečaja boste izpolnili zdravstveno izjavo in v kolikor ste v dobrem psihofizičnem stanju, izjave zdravnika ne potrebujete. Vsekakor pa nas je potrebno pred pričetkom tečaja opozoriti na morebitne zdravstvene zadržke. V primeru kroničnih zdravstvenih težav, kot so sladkorna bolezen, povišan krvni tlak, motnje ritma srca, epilepsija, poškodbe ušes in ostalo, je potrebno pred udeležbo na tečaju pridobiti soglasje zdravnika." },
      { q: "Kakšno opremo potrebujem v času tečaja?", a: "Uporabljamo osnovno ABC potapljaško opremo, kar vključuje masko, dihalko, uteži, plavuti in potapljaško obleko. Priporočamo potapljaško obleko debeline 5 mm in 8 kg uteži. Zaželena je uporaba neoprenskih nogavic in rokavic. Opremo potrebujemo tako na bazenskem kot morskem delu tečaja." },
      {
        q: "Ali si lahko opremo izposodim?",
        a: "Na voljo vam je izposoja vrhunske opreme za prosto potapljanje znamke Mares. Izposoja poteka v sodelovanju s trgovino Aquamania. V kolikor kupite kak kos opreme, na primer masko ali dihalko, je izposoja brezplačna, v nasprotnem primeru pa je izposoja celotne opreme za čas tečaja, bazen in globina, 40 €.",
        content: (
          <>
            Na voljo vam je izposoja vrhunske opreme za prosto potapljanje
            znamke Mares. Izposoja poteka v sodelovanju s trgovino{" "}
            <a
              href="https://www.aquamania.si/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Aquamania
            </a>
            . V kolikor kupite kak kos opreme, na primer masko ali dihalko, je
            izposoja brezplačna, v nasprotnem primeru pa je izposoja celotne
            opreme za čas tečaja, bazen in globina, 40 €.
          </>
        ),
      },
      { q: "Kakšen certifikat prejmem ob koncu tečaja?", a: "Za vsak nivo tečaja so predpisani minimalni standardi, ki vključujejo teoretični test in praktične vaje. Če izpolnite vse kriterije, prejmete SSI Freediving certifikat, ki je odvisen od nivoja tečaja." },
      { q: "Kako poteka teoretičen del?", a: "Ta navadno poteka v učilnici, njegovo trajanje pa je odvisno od nivoja tečaja. Točna lokacija in ura sta odvisna od termina in mesta izvajanja tečaja. V sklopu teoretičnih predavanj obravnavamo učno gradivo, video posnetke ter različne praktične vaje na suhem." },
      { q: "Kako poteka praktični del na bazenu?", a: "Pričnemo s tehnikami sproščanja in dihanja, čemur sledijo raztezne vaje. V bazenu poteka osvajanje veščin statične in dinamične apneje ter osnove tehnik izenačevanja." },
      { q: "Kako poteka praktični del na morju ali jezeru?", a: "Na morju poteka praktični del tečaja navadno v soboto in nedeljo. V tem času imamo na sporedu dihalne in raztezne vaje ter tri daljše serije potopov v globino. Uradni zaključek tečaja je po prvem dnevu, zato drugi dan izkoristimo za trening in utrjevanje znanja. Pri nadaljevalnih in master tečajih je število serij potopov daljše, zato praktični del na morju traja 3 do 5 dni. V poletnih mesecih lahko ob predhodni najavi tečaj opravljamo tudi v Bohinjskem jezeru. Urnik je enak tistemu na morju." },
      { q: "Ali je bivanje na morju ali jezeru vključeno v ceno tečaja?", a: "Bivanje na morju ni vključeno v ceno. Ta navadno znaša med 40 € in 60 € po osebi od petka do nedelje. Bivanje si organizira vsak sam, s tem, da mi predlagamo nastanitev, ki je najbližje mestu izvajanja tečaja." },
      { q: "Ali se v primeru bolezni prijavnina na tečaj vrača?", a: "V primeru nepredvidenih dogodkov se prijavnina na tečaj prenese na drug termin, ki ga poljubno izberete. V kolikor je odpoved najavljena 10 delovnih dni pred pričetkom tečaja, se prijavnina vrne v celoti, zadrži pa se 50 € akontacije, saj ta vključuje učno gradivo." },
      {
        q: "Ali imamo tečajniki kakšne ugodnosti pri nakupu opreme?",
        a: "Tečajniki imate posebne ugodnosti pri nakupu opreme v trgovini Aquamanija, Extremo, Aquas, Norik Sub in Scubatom. Več o ugodnostih in izdelkih v akciji boste izvedeli na tečaju.",
        content: (
          <>
            Tečajniki imate posebne ugodnosti pri nakupu opreme v trgovini{" "}
            <a
              href="https://www.aquamania.si/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Aquamanija
            </a>
            ,{" "}
            <a
              href="https://www.extremo.si/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Extremo
            </a>
            ,{" "}
            <a
              href="https://www.aquas.si/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Aquas
            </a>
            ,{" "}
            <a
              href="https://www.norik-sub.si/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Norik Sub
            </a>{" "}
            in{" "}
            <a
              href="https://www.scubatom.net/"
              className={answerLinkClassName}
              target="_blank"
              rel="noreferrer"
            >
              Scubatom
            </a>
            . Več o ugodnostih in izdelkih v akciji boste izvedeli na tečaju.
          </>
        ),
      },
      { q: "Imam izkušnje s prostim potapljanjem in sem se že potopil globlje od 20 m. Kateri nivo tečaja mi priporočate?", a: "Vsekakor priporočamo začetni tečaj, saj na njem obravnavamo veščine, ki predstavljajo temelj za prosto potapljanje. To so tehnike sproščanja, dihanja, reševanja, izenačevanja in podobno. V kolikor se izkaže, da je vaša fizična pripravljenost zelo dobra, vam bomo po koncu tečaja omogočili tudi varne globlje potope." },
      { q: "Opravil sem teoretični del tečaja, medtem ko sem globinski del izpustil. Ali lahko naknadno opravim ta del tečaja?", a: "Morski del tečaja lahko opravite naknadno. Vendar čas med teoretičnim in globinskim delom tečaja ne sme biti daljši od šestih mesecev. V kolikor ste bili na morski del prijavljeni in se ga niste udeležili ali pa ste odpoved sporočili manj kot deset delovnih dni pred pričetkom globinskega dela tečaja, je potrebno za ponovno prijavo in udeležbo na globinskem delu tečaja doplačati 50 €. Če je od časa opravljanja teoretičnega dela minilo več kot šest mesecev, imate s tem možnost ponovno sodelovati tudi na teoretičnem delu tečaja." },
      { q: "Udeležbo na globinskem delu tečaja sem odpovedal manj kot 10 dni pred pričetkom tega dela tečaja. Pod kakšnimi pogoji lahko izberem nov termin?", a: "V kolikor ste bili na globinski del prijavljeni in se ga niste udeležili ali pa ste odpoved sporočili manj kot deset delovnih dni pred pričetkom globinskega dela tečaja, je potrebno za ponovno prijavo in udeležbo na globinskem delu tečaja doplačati 50 €. Če je od časa opravljanja teoretičnega dela minilo več kot šest mesecev, imate s tem možnost ponovno sodelovati tudi na teoretičnem delu tečaja." },
    ],
  },
  {
    id: "treningi",
    title: "Treningi",
    description: "Prijava, članarina, vadnina, skupine",
    faqs: [
      {
        q: "Kako poteka prijava na treninge?",
        a: "Na treninge se prijavite preko prijavnega obrazca na strani Treningi, kjer izberete lokacijo, termin in nivo. Mesto v izbrani skupini rezervirate s spletnim plačilom letne članarine.",
        content: (
          <>
            Na treninge se prijavite preko prijavnega obrazca na strani{" "}
            <Link href="/treningi" className={answerLinkClassName}>
              Treningi
            </Link>
            , kjer izberete lokacijo, termin in nivo. Mesto v izbrani skupini
            rezervirate s spletnim plačilom letne članarine.
          </>
        ),
      },
      { q: "Kdaj je moja prijava potrjena?", a: "Vaša prijava je potrjena, ko oddate prijavo in preko spleta poravnate letno članarino v ŠD Apnea Slovenija. Članstvo v društvu je za udeležence treningov obvezno. Po prijavi prejmete potrditev in nadaljnja navodila za udeležbo na treningih." },
      { q: "Koliko znaša letna članarina v ŠD Apnea Slovenija?", a: "Letna članarina v ŠD Apnea Slovenija znaša 35 € in velja za obdobje oktober do oktober." },
      {
        q: "Koliko znaša vadnina za udeležbo na treningih?",
        a: "Znesek letne vadnine je odvisen od lokacije in števila izbranih treningov na teden. Podrobnosti najdete na strani Treningi.",
        content: (
          <>
            Znesek letne vadnine je odvisen od lokacije in števila izbranih
            treningov na teden. Podrobnosti najdete na strani{" "}
            <Link href="/treningi" className={answerLinkClassName}>
              Treningi
            </Link>
            .
          </>
        ),
      },
      { q: "Kako se poravna vadnina za udeležbo na treningih?", a: "Letno članarino poravnate ob spletni prijavi. Pred pričetkom treningov prejmete račun za plačilo letne vadnine. Do drugega tedna trajanja programa se poravna 60 % vadnine, preostanek pa do osmega tedna trajanja programa." },
      { q: "Kdo vodi treninge?", a: "Treninge vodijo plavalni trenerji in inštruktorji prostega potapljanja. Vsebino treningov pripravi Samo Jeranko." },
      { q: "Kakšna znanja bom osvojil na vaših treningih?", a: "Na treningih plavanja in prostega potapljanja boste osvojili plavalne tehnike prsno, kravl in delfinovo gibanje. Napredovali boste v sposobnosti zadrževanja sape in plavanja pod vodo. Prav tako boste osvojili tehnike dihanja, ki jih uporabljamo za pripravo na potop in po potopu. Tisti bolj ambiciozni pa lahko znotraj performance skupin napredujejo vse do vrhunskega tekmovalnega nivoja." },
      { q: "Kakšno opremo potrebujem za udeležbo na treningih?", a: "Na treningih uporabljamo kratke plavuti za trening plavanja, dihalko za učenje plavanja, športne kopalke, plavalno kapo, plavalna očala ali masko in vratno utež. V performance skupini uporabljamo dolge plavuti za prosto potapljanje in bazensko neoprensko obleko." },
      { q: "Koliko udeležencev je v eni skupini?", a: "Število razpisanih prostih mest je 7 ali 8 na eno plavalno progo, odvisno od lokacije. Izkaže pa se, da je povprečno število udeležencev tekom sezone manj kot 5 na progo, kar je optimalno." },
      { q: "Zakaj je potrebno podpisati dogovor o udeležbi na treningih?", a: "Narava vadbe od nas zahteva celoletne pogodbe z bazeni in trenerji. Zato tekom leta brez predhodnega dogovora ne moremo sprejemati odpovedi udeležbe. Prav tako skupina hitro napreduje, zato novih članov v primeru odpovedi in prostih mest ne moremo vključiti v naše programe. Iz teh razlogov pred pričetkom treninga udeleženci soglašajo z dogovorom o udeležbi na treningih." },
      { q: "Kako poteka odjava od treningov?", a: "Zaradi narave vadbe in hitrega napredka novih udeležencev v skupino po 2 mesecih treningov žal ne moremo sprejemati, saj zavirajo napredek preostale skupine. Zato se vam ob prijavi rezervira mesto do konca sezone. V primeru, da s treningi ne želite nadaljevati, lahko udeležbo odpoveste do osmega tedna trajanja programa. V tem primeru se vam oprosti plačilo drugega obroka letne vadnine. V primeru kasnejših odpovedi oprostitev plačila drugega dela vadnine žal ni več mogoča, prav tako ne vračilo." },
      {
        q: "Kje treningi potekajo?",
        a: "Treningi potekajo v Ljubljani, Kranju, Radovljici, Novi Gorici, Novem mestu in Kopru. Več o lokacijah in bazenih najdete na strani Treningi.",
        content: (
          <>
            Treningi potekajo v Ljubljani, Kranju, Radovljici, Novi Gorici,
            Novem mestu in Kopru. Več o lokacijah in bazenih najdete na strani{" "}
            <Link href="/treningi" className={answerLinkClassName}>
              Treningi
            </Link>
            .
          </>
        ),
      },
      { q: "Kakšna je razlika med začetno in nadaljevalno skupino?", a: "Začetna skupina je namenjena tistim, ki nimajo predznanja plavanja športnih tehnik plavanja, kot so kravl, prsno in delfinovo gibanje, zato prvo tretjino treningov posvetimo učenju tehnik plavanja. V drugem delu sezone so treningi zelo podobni nadaljevalni skupini, le da je intenzivnost vadbe v nadaljevalni skupini mnogo večja. V nadaljevalni skupini izpustimo del, ki se nanaša na učenje plavanja. Izvajamo le vaje za izboljšanje tehnike. Vse ostalo pa je usmerjeno v pridobivanje specifične kondicije za prosto potapljanje in izvajanje daljših potopov." },
      { q: "Kdo se lahko prijavi v performance in monofin skupino?", a: "Ta skupina je namenjena tistim, ki imajo znanje plavanja športnih disciplin, kot so kravl, prsno in delfinovo gibanje, in se lahko v celoti posvetijo apnea treningu. Ta skupina je najbolj atraktivna, saj vadba omogoča največji napredek. Je pa zato tudi intenzivnost vadbe s stališča plavanja pod vodo in zadrževanja sape najbolj zahtevna. Navadno se za to skupino odločijo tisti, ki trenirajo dvakrat na teden. Tako imajo en trening v nadaljevalni in en v performance skupini." },
      { q: "Kdo se lahko prijavi na trening statične apneje?", a: "Za udeležbo na treningu statične apneje predznanje in izkušnje niso potrebne." },
      { q: "Kakšna je struktura treningov?", a: "Treningi so strukturirani kot 15 minut ogrevanja na suhem in 60 minut treninga v vodi. Začetna in nadaljevalna skupina prvi del sezone posvetita kombinaciji plavanja in prostega potapljanja. Na ta način se napreduje v vseh komponentah prostega potapljanja in doseže največji napredek z izbranim volumnom treninga. V performance skupini pa vse od začetka sezone usmerjamo pozornost v intenzivno vadbo plavanja pod vodo." },
      { q: "Ali lahko treninge obiskujem večkrat na teden?", a: "Da, treninge lahko obiskujete večkrat na teden. Optimalno je 2x na teden." },
      { q: "Zanima me zgolj plavanje, ali je tovrsten trening primeren zame?", a: "Trening vključuje veliko plavanja in še več plavanja pod vodo. Sploh začetna in nadaljevalna skupina sta zelo popularni med ljubitelji plavanja. Cilj vadbe je, da se na koncu napreduje tako v plavanju kot v prostem potapljanju." },
      { q: "Ali je potrebno plavalno predznanje za prijavo na treninge?", a: "Plavalno predznanje je potrebno le za nadaljevalno in performance skupino, medtem ko za začetno skupino to ni potrebno." },
      { q: "Ali je pogoj za prijavo opravljen tečaj prostega potapljanja?", a: "Ne, za udeležbo na treningih tečaj prostega potapljanja ni potreben." },
      { q: "Opravljen imam začetni tečaj in veliko časa preživim na morju. Katera skupina je prava izbira zame?", a: "V kolikor imate izkušnje s treningom plavanja, potem predlagamo nadaljevalno skupino. Če pa je bazenski trening za vas nekaj novega, potem predlagamo začetno skupino." },
      { q: "Ali lahko sredi sezone zamenjam nivo skupine?", a: "Da, v kolikor se izkaže, da je nivo izbrane skupine previsok ali prenizek, vsekakor omogočimo menjavo skupine." },
      { q: "Katero skupino priporočate podvodnim lovcem?", a: "V kolikor imate izkušnje s treningom plavanja, potem predlagamo nadaljevalno skupino. Če pa je bazenski trening za vas nekaj novega, potem predlagamo začetno skupino. V obeh skupinah je končni cilj enak, le usmerjenost treningov je v prvem delu sezone različna. V primeru treninga 2x tedensko pa priporočamo kombinacijo s treningom statike." },
      { q: "Imam tekmovalne ambicije v prostem potapljanju, katero skupino izbrati?", a: "Predlagamo kombinacijo nadaljevalne in performance skupine, če že obvladate plavalne tehnike." },
      { q: "Ali se na treningu obravnavajo tudi dihalne in sprostitvene tehnike?", a: "Da. Navadno imamo drugo soboto v januarju predavanje na temo tehnik dihanja. Prav tako vam tehnike dihanja pred in po potopu pojasnijo trenerji na bazenu." },
      { q: "Kaj mi priporočate, če imam strah pred vodo?", a: "Priporočamo vam individualne plavalne ure. Tako boste lahko v miru zgradili zaupanje v svoje veščine. V kolikor bi to želeli izvajati z našo pomočjo, vam pri tem z veseljem pomagamo." },
    ],
  },
  {
    id: "darilni-boni",
    title: "Darilni boni",
    description: "Nakup, veljavnost, uporaba",
    faqs: [
      {
        q: "Kako lahko naročim darilni bon?",
        a: "Darilni bon lahko naročite na strani Darilni bon.",
        content: (
          <>
            Darilni bon lahko naročite na strani{" "}
            <Link href="/darilni-bon" className={answerLinkClassName}>
              Darilni bon
            </Link>
            .
          </>
        ),
      },
      { q: "Ali lahko naročim vrednostni bon za eno od vaših aktivnosti?", a: "Da, lahko se dogovorimo za vrednostni bon, ki ga prejemnik izkoristi za eno od naših aktivnosti." },
      { q: "Kako dolgo velja darilni bon?", a: "Darilni bon velja eno leto od izdaje oziroma dlje časa, če je bilo tako dogovorjeno ob nakupu." },
      { q: "Kako lahko prevzamem darilni bon?", a: "Prevzamete ga lahko osebno v Ljubljani ali pa vam ga pošljemo po pošti." },
    ],
  },
];

export default function VprasanjaPage() {
  const allFaqs = sections.flatMap((s) => s.faqs);

  return (
    <>
      <FAQPageJsonLd items={allFaqs} />
      {/* Header with section navigation */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-[36px] md:text-[48px] font-bold leading-[1.08] tracking-[-0.02em] text-navy mb-4">
            Pogosta vprašanja
          </h1>
          <p className="text-[17px] text-body leading-[1.6] font-body mb-10">
            Odgovori na najpogostejša vprašanja o tečajih, treningih in
            darilnih bonih. Če ne najdete odgovora,{" "}
            <Link
              href="/kontakt"
              className="text-gold hover:text-gold-hover transition-colors"
            >
              nam pišite
            </Link>
            .
          </p>

          {/* Jump links */}
          <div className="flex flex-wrap gap-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="border border-border-custom px-4 py-2 text-[14px] font-medium text-navy font-body hover:border-gold hover:text-gold transition-colors"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      {sections.map((section, sectionIndex) => (
        <section
          key={section.id}
          id={section.id}
          className={sectionIndex % 2 === 1 ? "bg-surface py-16 md:py-20" : "py-16 md:py-20"}
        >
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex items-baseline gap-4 mb-8">
              <h2 className="text-[24px] md:text-[28px] font-semibold">
                {section.title}
              </h2>
              <span className="text-sm text-muted-text font-body">
                {section.description}
              </span>
            </div>

            <div>
              {section.faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-border-custom"
                >
                  <summary className="flex items-center justify-between py-5 cursor-pointer list-none">
                    <span className="text-[16px] font-medium text-navy font-body pr-8">
                      {faq.q}
                    </span>
                    <span className="text-gold text-xl shrink-0 group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-[15px] text-body leading-[1.7] font-body">
                    {faq.content ?? faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Still have questions */}
      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[24px] md:text-[28px] font-semibold mb-4">
            Niste našli odgovora?
          </h2>
          <p className="text-[17px] text-body font-body mb-8">
            Pišite nam na{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-gold hover:text-gold-hover transition-colors"
            >
              {siteConfig.email}
            </a>{" "}
            ali pokličite{" "}
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="text-gold hover:text-gold-hover transition-colors"
            >
              {siteConfig.phone}
            </a>
            .
          </p>
          <Button asChild>
            <Link href="/kontakt">Kontaktni obrazec →</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
