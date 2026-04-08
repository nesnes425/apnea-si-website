export const siteConfig = {
  name: "Apnea Slovenija",
  url: "https://apnea.si",
  email: "info@apnea.si",
  phone: "+386 40 XXX XXX", // TODO: Get Samo's phone number
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
  courses: {
    zacetni: {
      name: "Začetni tečaj",
      fullName: "Začetni tečaj prostega potapljanja",
      certification: "SSI Freediving Level 1",
      price: 395,
      priceInCents: 39500,
    },
    nadaljevalni: {
      name: "Nadaljevalni tečaj",
      fullName: "Nadaljevalni tečaj prostega potapljanja",
      certification: "SSI Freediving Level 2",
      price: 415,
      priceInCents: 41500,
    },
    master: {
      name: "Master tečaj",
      fullName: "Master tečaj prostega potapljanja",
      certification: "SSI Freediving Level 3",
      price: 550,
      priceInCents: 55000,
    },
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
    { label: "Tečaji", href: "/tecaji" },
    { label: "Treningi", href: "/treningi" },
    { label: "O nas", href: "/o-nas" },
    { label: "Novice", href: "/novice" },
    { label: "Kontakt", href: "/kontakt" },
  ] as const,

  // Footer navigation
  footerNav: {
    legal: [
      { label: "Zasebnost", href: "/zasebnost" },
      { label: "Pogoji poslovanja", href: "/pogoji" },
      { label: "Piškotki", href: "#cookie-settings" },
    ],
  },
} as const;

export type CourseType = keyof typeof siteConfig.courses;
export type Location = (typeof siteConfig.locations)[number];
