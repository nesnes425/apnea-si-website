import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata = {
  title: "Politika zasebnosti",
  description:
    "Politika zasebnosti in izjava o varstvu osebnih podatkov, Apnea Slovenija.",
  alternates: { canonical: "/zasebnost" },
};

const tocSections = [
  { id: "upravljalca", label: "Upravljalca" },
  { id: "pridobivanje", label: "Pridobivanje podatkov" },
  { id: "zbiranje", label: "Katere podatke zbiramo" },
  { id: "obdelovalci", label: "Zunanji ponudniki" },
  { id: "pravice", label: "Vaše pravice" },
  { id: "piskotki", label: "Piškotki" },
  { id: "pritozbe", label: "Pritožbe" },
];

export default function ZasebnostPage() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-[220px_1fr] gap-12 md:gap-16">
          {/* Sidebar navigation */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
                Na tej strani
              </p>
              <nav className="space-y-2">
                {tocSections.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block text-sm text-muted-text font-body hover:text-navy transition-colors py-1"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-2xl">
            <h1 className="text-[34px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-navy mb-4">
              Politika zasebnosti
            </h1>
            <p className="text-sm text-muted-text font-body mb-12">
              Zadnja posodobitev: april 2026
            </p>

            <div className="prose-apnea">
              <h2 id="upravljalca">Upravljalca spletne strani</h2>
              <p>
                <strong>Športno društvo Apnea Slovenija</strong>
                <br />
                Saveljska cesta 70A, 1000 Ljubljana
                <br />
                {siteConfig.email}
              </p>
              <p>
                <strong>
                  Inženirske in športne storitve, Samo Jeranko s.p.
                </strong>
                <br />
                Saveljska cesta 70A, 1000 Ljubljana
                <br />
                samo.jeranko@gmail.com
              </p>
              <p>
                Upravljalca se zavezujeta k varovanju zaupnosti vaših osebnih
                podatkov. Zbrane informacije bosta uporabila izključno za
                navedene namene in zakonske obveznosti. Osebni podatki se
                posredujejo tretjim osebam samo, kadar je to potrebno za
                izvedbo storitve, izpolnitev zakonskih obveznosti ali uporabo
                pogodbenih obdelovalcev, ki za upravljalca zagotavljajo
                tehnične, plačilne, e-poštne ali računovodske storitve.
              </p>

              <h2 id="pridobivanje">Pridobivanje osebnih podatkov</h2>
              <p>Osebne podatke pridobivamo preko:</p>
              <ul>
                <li>Obrazcev za prijavo na tečaje in dogodke</li>
                <li>Spletnih obrazcev (kontaktni obrazec, prijava na obvestila)</li>
                <li>Telefonske komunikacije in elektronske pošte</li>
                <li>Osebnih srečanj</li>
              </ul>

              <h2 id="zbiranje">Katere osebne podatke zbiramo</h2>

              <h3>Obisk spletne strani</h3>
              <p>
                Strežniški dnevniki beležijo IP naslove, različice brskalnikov
                in čase obiskov. Podatki se hranijo 30 dni in se uporabljajo
                izključno za varnost omrežja.
              </p>

              <h3>Udeležba na tečajih</h3>
              <p>Za namen prijave na tečaje in izvedbo zbiramo:</p>
              <ul>
                <li>Ime in priimek, naslov, poštna številka, država</li>
                <li>E-pošta, telefon, datum rojstva, spol</li>
                <li>Fotografije, jezikovna nastavitev</li>
                <li>SSI identifikacijske in certifikacijske podatke</li>
                <li>Zdravstvene podatke in podatke o zavarovanju</li>
              </ul>
              <p>Podatki se hranijo do vašega preklica.</p>

              <h3>Plačila (Stripe)</h3>
              <p>
                Plačila obdelujemo preko ponudnika Stripe. Podatkov o plačilnih
                karticah ne shranjujemo na naših strežnikih, saj jih obdeluje
                izključno Stripe v skladu s PCI DSS standardi.
              </p>
              <p>
                Pri spletni prijavi na trening se podatki, ki so potrebni za
                plačilo članarine, potrditev prijave in izdajo računa, posredujejo
                ponudniku Stripe in se uporabijo za izvedbo plačila. Ti podatki
                lahko vključujejo ime in priimek, e-pošto, telefon, izbrani
                program, lokacijo, termin in identifikator plačila.
              </p>

              <h3>Treningi in članstvo</h3>
              <p>
                Za namen prijave na treninge, rezervacije mesta v skupini,
                plačila članarine, članstva v ŠD Apnea Slovenija in izdaje
                računov zbiramo kontaktne podatke udeleženca, izbrano skupino,
                lokacijo, termin in podatke, ki so potrebni za računovodsko
                obdelavo.
              </p>

              <h3>E-poštna obvestila (Brevo)</h3>
              <p>
                Če se prijavite na obvestila, vaš e-naslov shranimo v sistemu
                Brevo. Lahko se kadarkoli odjavite s klikom na povezavo v
                vsakem sporočilu.
              </p>

              <h2 id="obdelovalci">Zunanji ponudniki in pogodbeni obdelovalci</h2>
              <p>
                Za delovanje spletne strani, obrazcev, e-poštnih obvestil,
                plačil, analitike in izdaje računov lahko uporabljamo zunanje
                ponudnike, med drugim Vercel, Sanity, Brevo, Stripe, Google
                Analytics, Meta Pixel in Minimax. Ti ponudniki osebne podatke
                obdelujejo samo v obsegu, ki je potreben za izvedbo posamezne
                storitve.
              </p>

              <h2 id="pravice">Vaše pravice</h2>
              <p>V skladu z GDPR imate pravico do:</p>
              <ul>
                <li>Dostopa do vaših osebnih podatkov</li>
                <li>Popravka netočnih podatkov</li>
                <li>
                  Izbrisa podatkov (&ldquo;pravica do pozabe&rdquo;)
                </li>
                <li>Omejitve obdelave</li>
                <li>Ugovora obdelavi</li>
                <li>Prenosljivosti podatkov</li>
              </ul>
              <p>
                Za uveljavljanje pravic pišite na{" "}
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
              </p>

              <h2>Avtomatizirane odločitve</h2>
              <p>
                Avtomatizirano sprejemanje odločitev ali profiliranje se ne
                izvaja.
              </p>

              <h2 id="piskotki">Piškotki</h2>
              <p>
                Spletna stran uporablja piškotke za analitiko (Google Analytics)
                in oglaševanje (Facebook Pixel), ki se naložijo šele po vašem
                soglasju. Nujni piškotki (Stripe za plačila, piškotki seje) se
                naložijo brez soglasja. Nastavitve piškotkov lahko kadarkoli
                spremenite.
              </p>

              <h2 id="pritozbe">Pritožbe</h2>
              <p>
                Informacijski pooblaščenec Republike Slovenije
                <br />
                Dunajska cesta 22, 1000 Ljubljana
                <br />
                <a href="mailto:gp.ip@ip-rs.si">gp.ip@ip-rs.si</a>
                <br />
                01 230 97 30 ·{" "}
                <a
                  href="https://www.ip-rs.si"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.ip-rs.si
                </a>
              </p>
            </div>

            <div className="mt-16 pt-8 border-t border-border-custom">
              <p className="text-sm text-muted-text font-body">
                Pogoji uporabe storitev so opisani v{" "}
                <Link
                  href="/pogoji"
                  className="text-gold hover:text-gold-hover transition-colors"
                >
                  Splošnih pogojih poslovanja
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
