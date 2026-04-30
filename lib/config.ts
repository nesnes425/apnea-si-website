export const siteConfig = {
  name: "Apnea Slovenija",
  url: "https://apnea.si",
  email: "info@apnea.si",
  phone: "+386 41 874 187",
  description:
    "Največja šola prostega potapljanja v Sloveniji. SSI tečaji, treningi in klubsko potapljanje.",

  // Legal entities
  entities: {
    courses: {
      name: "Samo Jeranko s.p.",
      description: "Courses (beginner, advanced, master, gift vouchers)",
    },
    trainings: {
      name: "ŠD Apnea Slovenija",
      description: "Club trainings and membership",
    },
  },

  // Social links
  social: {
    instagram: "https://www.instagram.com/samojeranko/",
    facebook: "https://www.facebook.com/apnea.si",
    linkedin: "https://www.linkedin.com/in/samo-jeranko-745272a0",
  },

  // Stats (for social proof sections)
  stats: {
    diversTrained: "2000+",
    googleReviews: "245+",
    googleRating: "5.0",
    yearsExperience: "15+",
    worldChampionshipMedals: "10",
    coachingMedals: "15",
    nationalRecords: "46",
  },

  // Locations
  locations: [
    "Ljubljana",
    "Nova Gorica",
    "Velenje",
    "Novo Mesto",
    "Koper",
  ] as const,

  // Course pricing (cents for Stripe, display for UI)
  // Stripe IDs are read from env vars — see lib/stripe/products.ts
  courses: {
    zacetni: {
      name: "Začetni tečaj",
      fullName: "Začetni tečaj prostega potapljanja",
      certification: "SSI Freediving Level 1",
      price: 395,
      priceInCents: 39500,
      slug: "zacetni",
      booking: {
        sidebarItems: [
          "SSI Freediving Level 1",
          "Teorija + bazen + morje",
          "Digitalno učno gradivo",
          "Oprema za izposojo",
        ],
      },
    },
    nadaljevalni: {
      name: "Nadaljevalni tečaj",
      fullName: "Nadaljevalni tečaj prostega potapljanja",
      certification: "SSI Freediving Level 2",
      price: 415,
      priceInCents: 41500,
      slug: "nadaljevalni",
      booking: {
        sidebarItems: [
          "SSI Freediving Level 2",
          "Frenzel izenačevanje",
          "Ciljna globina 25–35 m",
          "Oprema za izposojo",
        ],
      },
    },
    master: {
      name: "Master tečaj",
      fullName: "Master tečaj prostega potapljanja",
      certification: "SSI Freediving Level 3",
      price: 550,
      priceInCents: 55000,
      slug: "master",
      booking: {
        sidebarItems: [
          "SSI Freediving Level 3",
          "Mouthfill izenačevanje",
          "Ciljna globina 30–40 m",
          "+2 vodena treninga",
        ],
      },
    },
  },

  // Gift voucher
  giftVoucher: {
    name: "Darilni bon — Začetni tečaj",
    fullName: "Darilni bon — Začetni tečaj prostega potapljanja",
    price: 395,
    priceInCents: 39500,
    validityMonths: 12,
  },

  // Training pricing
  trainings: {
    membership: {
      name: "Letna članarina",
      price: 35,
      entity: "ŠD Apnea Slovenija",
    },
  },

  // Navigation
  nav: [
    { label: "Začetni tečaj", href: "/tecaji/zacetni" },
    { label: "Treningi", href: "/treningi" },
    { label: "Predavanja", href: "/predavanja" },
    { label: "Darilni bon", href: "/darilni-bon" },
    { label: "Novice", href: "/novice" },
    { label: "O nas", href: "/o-nas" },
    { label: "FAQ", href: "/vprasanja" },
    { label: "Kontakt", href: "/kontakt" },
  ] as const,

  // Footer navigation
  footerNav: {
    pages: [
      { label: "Začetni tečaj", href: "/tecaji/zacetni" },
      { label: "Nadaljevalni tečaj", href: "/tecaji/nadaljevalni" },
      { label: "Master tečaj", href: "/tecaji/master" },
      { label: "Treningi", href: "/treningi" },
      { label: "Predavanja", href: "/predavanja" },
      { label: "Darilni bon", href: "/darilni-bon" },
      { label: "Vprašanja", href: "/vprasanja" },
    ],
    legal: [
      { label: "Zasebnost", href: "/zasebnost" },
      { label: "Pogoji poslovanja", href: "/pogoji" },
    ],
  },
} as const;

export type CourseType = keyof typeof siteConfig.courses;
export type Location = (typeof siteConfig.locations)[number];
