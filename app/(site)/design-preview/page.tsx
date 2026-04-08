import Image from "next/image";

const colors = [
  { name: "navy", hex: "#33404f", label: "Headings, buttons" },
  { name: "navy-dark", hex: "#181E25", label: "Footer, nav bg" },
  { name: "navy-light", hex: "#4a5568", label: "Secondary text" },
  { name: "gold", hex: "#d3a356", label: "Primary CTA, links" },
  { name: "gold-hover", hex: "#c18f3e", label: "Hover states" },
  { name: "gold-light", hex: "#f5e6c8", label: "Badges, highlights" },
  { name: "gold-pale", hex: "#faf4e8", label: "Accent section bg" },
  { name: "body", hex: "#585a5a", label: "Body text" },
  { name: "muted", hex: "#8a8d8e", label: "Captions, meta" },
  { name: "border", hex: "#e8e8e6", label: "Borders, dividers" },
  { name: "surface", hex: "#f7f7f5", label: "Alt section bg" },
  { name: "white", hex: "#ffffff", label: "Primary bg" },
];

export default function DesignPreview() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-border-custom px-6 py-4">
        <p className="text-center text-sm text-muted-text font-body">
          Apnea.si Design Preview — za interno uporabo
        </p>
      </div>

      {/* Color Palette */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Barvna paleta</h1>
        <p className="text-body mb-10">
          Razširjena paleta z dodanimi sivimi toni, ozadji in robovi. Vsi sivi
          imajo topel podton (ne hladen modro-siv).
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {colors.map((c) => (
            <div key={c.name}>
              <div
                className="h-20 rounded-lg border border-border-custom"
                style={{ backgroundColor: c.hex }}
              />
              <p className="mt-2 text-sm font-medium text-navy">{c.name}</p>
              <p className="text-xs text-muted-text">{c.hex}</p>
              <p className="text-xs text-body">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="px-6 py-16 max-w-6xl mx-auto bg-surface">
        <h2 className="text-3xl font-bold mb-10">Tipografija</h2>

        <div className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              H1 — Lora 700, 56px, tracking -0.02em
            </p>
            <h1 className="text-[56px] font-bold leading-[1.1] tracking-[-0.02em]">
              Odkrijte svet prostega potapljanja
            </h1>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              H2 — Lora 600, 40px, tracking -0.01em
            </p>
            <h2 className="text-[40px] font-semibold leading-[1.15] tracking-[-0.01em]">
              Zakaj izbrati Apnea Slovenija
            </h2>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              H3 — Lora 600, 28px
            </p>
            <h3 className="text-[28px] font-semibold leading-[1.2]">
              Začetni tečaj prostega potapljanja
            </h3>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              H4 — Roboto 500, 20px (sans for small headings)
            </p>
            <h4 className="text-[20px] font-medium leading-[1.3] font-body">
              Kaj je vključeno v tečaj
            </h4>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              Overline — Roboto 500, 13px, uppercase, wide tracking
            </p>
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body">
              Tečaji prostega potapljanja
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              Body large — Roboto 400, 20px (hero subtitles, intros)
            </p>
            <p className="text-[20px] text-body leading-[1.6] font-body">
              Potapljanje na vdih ni le šport, temveč način sprostitve in
              povezovanja z vodo. Spoznajte, zakaj nas navdihuje in zakaj lahko
              navduši tudi vas.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              Body — Roboto 400, 17px (main reading text)
            </p>
            <p className="text-[17px] text-body leading-[1.7] font-body max-w-2xl">
              Prosto potapljanje je najčistejši stik z morjem. Ni jeklenk, ni
              hrupa, ni filtrov. Samo ti in tvoj dih. Ni pomembno, kako globoko
              se spustiš ali kako dolgo ostaneš pod gladino. Pomembno je, da se
              sprostiš, prepustiš trenutku in občutiš mir, ki ga prinese voda.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-text font-medium font-body mb-2">
              Small / Caption — Roboto 400, 14px
            </p>
            <p className="text-sm text-muted-text font-body">
              Objavljeno 15. marca 2026 · 5 min branja
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OPTION A: SHARP EDGES */}
      {/* ============================================ */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="border-b-2 border-navy pb-4 mb-16">
          <h2 className="text-3xl font-bold">Možnost A — Ostri robovi</h2>
          <p className="text-body mt-2 font-body">
            Gumbi brez zaoblitev, slike z ostrimi robovi, kartice brez senc.
            Bolj editorski, rezek, samozavesten.
          </p>
        </div>

        {/* Buttons - Sharp */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Gumbi</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="bg-gold text-white px-7 py-3.5 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors">
              Rezervirajte mesto →
            </button>
            <button className="bg-navy text-white px-7 py-3.5 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy-light transition-colors">
              Več o tečajih
            </button>
            <button className="border-2 border-navy text-navy px-7 py-3.5 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy hover:text-white transition-colors">
              Kontaktirajte nas
            </button>
            <a
              href="#"
              className="text-gold text-[15px] font-medium font-body hover:text-gold-hover transition-colors"
            >
              Preberi več →
            </a>
          </div>
        </div>

        {/* Course Cards - Sharp */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Kartice tečajev</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Začetni tečaj",
                level: "SSI Level 1",
                price: "395",
                desc: "Idealen za začetnike. Naučite se osnov prostega potapljanja v varnem okolju.",
              },
              {
                title: "Nadaljevalni tečaj",
                level: "SSI Level 2",
                price: "415",
                desc: "Poglobite svoje znanje. Frenzel izenačevanje, globine 25–35m.",
              },
              {
                title: "Master tečaj",
                level: "SSI Level 3",
                price: "550",
                desc: "Za izkušene potapljače. Mouthfill tehnika, globine 30–40m.",
              },
            ].map((course) => (
              <div
                key={course.title}
                className="border border-border-custom p-8 group hover:border-gold transition-colors"
              >
                <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                  {course.level}
                </p>
                <h3 className="text-[24px] font-semibold mb-3">
                  {course.title}
                </h3>
                <p className="text-body font-body mb-6 leading-relaxed">
                  {course.desc}
                </p>
                <div className="flex items-baseline justify-between">
                  <p className="text-[28px] font-bold text-navy">
                    €{course.price}
                  </p>
                  <button className="bg-gold text-white px-5 py-2.5 text-sm font-medium font-body hover:bg-gold-hover transition-colors">
                    Več info →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image + Text - Sharp */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">
            Slika + besedilo sekcija
          </h3>
          <div className="grid md:grid-cols-2 gap-0 items-stretch">
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src="/images/placeholder/tecaj-morje.png"
                alt="Tečaj prostega potapljanja v morju"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-surface p-12 flex flex-col justify-center">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
                Zakaj prosto potapljanje
              </p>
              <h2 className="text-[32px] font-semibold leading-[1.2] mb-6">
                Najčistejši stik z morjem
              </h2>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                Ni jeklenk, ni hrupa, ni filtrov. Samo ti in tvoj dih. Ko
                potoneš, telo uporabi svoje prastare mehanizme. Srčni utrip se
                umiri, misli se ustavijo, dih postane spomin.
              </p>
              <div>
                <button className="bg-gold text-white px-7 py-3.5 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors">
                  Prijavi se na tečaj →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial - Sharp */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Mnenja</h3>
          <div className="border-l-4 border-gold pl-8 py-4 max-w-2xl">
            <p className="text-[20px] text-navy leading-[1.6] italic font-heading mb-4">
              &ldquo;Tečaj je bil neverjetna izkušnja. Samo je odličen
              inštruktor — zna razložiti vse na preprost in umirjen način.
              Zadržal sem dih več kot 3 minute!&rdquo;
            </p>
            <div>
              <p className="text-[15px] font-medium text-navy font-body">
                Matej K.
              </p>
              <p className="text-sm text-muted-text font-body">
                Začetni tečaj, Ljubljana 2025
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar - Sharp */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Statistike</h3>
          <div className="bg-navy text-white grid grid-cols-2 md:grid-cols-4">
            {[
              { number: "2000+", label: "potapljačev" },
              { number: "245+", label: "Google ocen" },
              { number: "5.0 ★", label: "povprečna ocena" },
              { number: "15+", label: "let izkušenj" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-8 text-center border-r border-white/10 last:border-r-0"
              >
                <p className="text-[32px] font-bold text-gold font-heading">
                  {stat.number}
                </p>
                <p className="text-sm text-white/70 font-body mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OPTION B: ROUNDED */}
      {/* ============================================ */}
      <section className="px-6 py-20 max-w-6xl mx-auto bg-surface">
        <div className="border-b-2 border-navy pb-4 mb-16">
          <h2 className="text-3xl font-bold">Možnost B — Zaobljeni robovi</h2>
          <p className="text-body mt-2 font-body">
            Gumbi z zaobljenimi robovi (rounded-lg), slike z zaobljenimi koti,
            kartice s sencami. Bolj prijazen, dostopen, topel.
          </p>
        </div>

        {/* Buttons - Rounded */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Gumbi</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="bg-gold text-white px-7 py-3.5 rounded-lg text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors shadow-sm">
              Rezervirajte mesto →
            </button>
            <button className="bg-navy text-white px-7 py-3.5 rounded-lg text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy-light transition-colors shadow-sm">
              Več o tečajih
            </button>
            <button className="border-2 border-navy text-navy px-7 py-3.5 rounded-lg text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy hover:text-white transition-colors">
              Kontaktirajte nas
            </button>
            <a
              href="#"
              className="text-gold text-[15px] font-medium font-body hover:text-gold-hover transition-colors"
            >
              Preberi več →
            </a>
          </div>
        </div>

        {/* Course Cards - Rounded */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Kartice tečajev</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Začetni tečaj",
                level: "SSI Level 1",
                price: "395",
                desc: "Idealen za začetnike. Naučite se osnov prostega potapljanja v varnem okolju.",
              },
              {
                title: "Nadaljevalni tečaj",
                level: "SSI Level 2",
                price: "415",
                desc: "Poglobite svoje znanje. Frenzel izenačevanje, globine 25–35m.",
              },
              {
                title: "Master tečaj",
                level: "SSI Level 3",
                price: "550",
                desc: "Za izkušene potapljače. Mouthfill tehnika, globine 30–40m.",
              },
            ].map((course) => (
              <div
                key={course.title}
                className="bg-white border border-border-custom rounded-xl p-8 shadow-sm hover:shadow-md hover:border-gold/40 transition-all"
              >
                <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-3">
                  {course.level}
                </p>
                <h3 className="text-[24px] font-semibold mb-3">
                  {course.title}
                </h3>
                <p className="text-body font-body mb-6 leading-relaxed">
                  {course.desc}
                </p>
                <div className="flex items-baseline justify-between">
                  <p className="text-[28px] font-bold text-navy">
                    €{course.price}
                  </p>
                  <button className="bg-gold text-white px-5 py-2.5 rounded-lg text-sm font-medium font-body hover:bg-gold-hover transition-colors shadow-sm">
                    Več info →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image + Text - Rounded */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">
            Slika + besedilo sekcija
          </h3>
          <div className="grid md:grid-cols-2 gap-0 items-stretch rounded-2xl overflow-hidden shadow-lg">
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src="/images/placeholder/tecaj-morje.png"
                alt="Tečaj prostega potapljanja v morju"
                fill
                className="object-cover"
              />
            </div>
            <div className="bg-white p-12 flex flex-col justify-center">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
                Zakaj prosto potapljanje
              </p>
              <h2 className="text-[32px] font-semibold leading-[1.2] mb-6">
                Najčistejši stik z morjem
              </h2>
              <p className="text-[17px] text-body leading-[1.7] font-body mb-8">
                Ni jeklenk, ni hrupa, ni filtrov. Samo ti in tvoj dih. Ko
                potoneš, telo uporabi svoje prastare mehanizme. Srčni utrip se
                umiri, misli se ustavijo, dih postane spomin.
              </p>
              <div>
                <button className="bg-gold text-white px-7 py-3.5 rounded-lg text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors shadow-sm">
                  Prijavi se na tečaj →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial - Rounded */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Mnenja</h3>
          <div className="bg-white rounded-xl p-10 shadow-sm max-w-2xl">
            <div className="flex gap-1 text-gold mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-xl">
                  ★
                </span>
              ))}
            </div>
            <p className="text-[20px] text-navy leading-[1.6] italic font-heading mb-6">
              &ldquo;Tečaj je bil neverjetna izkušnja. Samo je odličen
              inštruktor — zna razložiti vse na preprost in umirjen način.
              Zadržal sem dih več kot 3 minute!&rdquo;
            </p>
            <div>
              <p className="text-[15px] font-medium text-navy font-body">
                Matej K.
              </p>
              <p className="text-sm text-muted-text font-body">
                Začetni tečaj, Ljubljana 2025
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bar - Rounded */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Statistike</h3>
          <div className="bg-navy text-white grid grid-cols-2 md:grid-cols-4 rounded-xl overflow-hidden">
            {[
              { number: "2000+", label: "potapljačev" },
              { number: "245+", label: "Google ocen" },
              { number: "5.0 ★", label: "povprečna ocena" },
              { number: "15+", label: "let izkušenj" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-8 text-center border-r border-white/10 last:border-r-0"
              >
                <p className="text-[32px] font-bold text-gold font-heading">
                  {stat.number}
                </p>
                <p className="text-sm text-white/70 font-body mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SAMPLE HERO SECTION */}
      {/* ============================================ */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="border-b-2 border-navy pb-4 mb-16">
          <h2 className="text-3xl font-bold">Hero sekcija — vzorec</h2>
          <p className="text-body mt-2 font-body">
            Kot na beta stranki: fotografija čez celotno širino, besedilo na
            levi.
          </p>
        </div>
      </section>

      {/* Full-width hero mock */}
      <div className="relative w-full h-[500px] md:h-[600px]">
        <Image
          src="/images/placeholder/tecaj-bled.png"
          alt="Tečaj prostega potapljanja"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-16 max-w-2xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
              SSI Freediving Level 1
            </p>
            <h1 className="text-[40px] md:text-[56px] font-bold leading-[1.1] tracking-[-0.02em] text-navy mb-6">
              Začetni tečaj prostega potapljanja
            </h1>
            <p className="text-[18px] md:text-[20px] text-body leading-[1.6] font-body mb-8">
              Potapljanje na vdih ni le šport, temveč način sprostitve in
              povezovanja z vodo. Spoznajte, zakaj nas navdihuje.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-gold text-white px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-gold-hover transition-colors">
                Rezervirajte mesto →
              </button>
              <button className="border-2 border-navy text-navy px-8 py-4 text-[15px] font-medium tracking-[0.02em] font-body hover:bg-navy hover:text-white transition-colors">
                Več o tečaju
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature list with checkmarks */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="border-b-2 border-navy pb-4 mb-16">
          <h2 className="text-3xl font-bold">Seznam z zlatimi kljukicami</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-6 max-w-4xl">
          {[
            "Do 6 ur teorije v majhnih skupinah",
            "3 ure bazena — dihalne vaje in tehnike",
            "6 ur morja — pravo prosto potapljanje",
            "SSI Freediving Level 1 certifikat",
            "Video analiza vaših potopov",
            "Majhne skupine (do 6 udeležencev)",
          ].map((item) => (
            <div key={item} className="flex gap-3 items-start">
              <span className="text-gold text-xl mt-0.5 shrink-0">✓</span>
              <p className="text-[17px] text-body leading-[1.6] font-body">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="bg-navy-dark text-white/60 px-6 py-8 text-center text-sm font-body">
        <p>
          Ta stran je samo za predogled dizajna. Odstranjena bo pred objavo.
        </p>
      </div>
    </div>
  );
}
