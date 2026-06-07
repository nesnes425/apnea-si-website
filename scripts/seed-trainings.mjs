/**
 * Seed provisional Apnea.si training content from the existing website.
 *
 * Existing documents use deterministic IDs, so rerunning updates them safely.
 * Applications remain closed until Samo reviews the next season's schedule.
 *
 * Usage: node scripts/seed-trainings.mjs
 */

import { createClient } from "@sanity/client";
import { createReadStream, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const sanity = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-04-08",
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

const block = (text) => [
  {
    _key: crypto.randomUUID(),
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: crypto.randomUUID(), _type: "span", marks: [], text }],
  },
];

const programs = [
  {
    id: "training-program-zacetni",
    slug: "zacetni",
    name: "Začetni program",
    shortDescription: "Osnove plavanja in varnega prostega potapljanja za popolne začetnike.",
    placementGuidance: "Za vse, ki nimajo izkušenj s športnimi tehnikami plavanja ali rednim treningom prostega potapljanja.",
    description: "Program razvija tehnike kravla, prsnega in delfinovega gibanja, splošno plavalno kondicijo, CO₂/O₂ vadbo, dihanje, sproščanje in varne daljše potope.",
    equipment: "Športne kopalke, plavalna očala, kratke plavuti, dihalka in vratna utež.",
    sortOrder: 1,
    image: "public/images/placeholder/tecaj-bazen-samo.png",
  },
  {
    id: "training-program-nadaljevalni",
    slug: "nadaljevalni",
    name: "Nadaljevalni program",
    shortDescription: "Intenzivnejši sistematični trening za izkušene plavalce in proste potapljače.",
    placementGuidance: "Za tiste, ki že obvladajo kravl in prsno tehniko plavanja. Opravljen začetni tečaj sam po sebi ni dovolj, če plavalna tehnika še ni suverena.",
    description: "Program izboljšuje tehniko plavanja, aerobno in anaerobno pripravljenost, CO₂/O₂ toleranco ter pripravljenost za poletno sezono.",
    equipment: "Športne kopalke, plavalna očala, kratke plavuti, dihalka in vratna utež; bazenski neopren po želji.",
    sortOrder: 2,
    image: "public/images/placeholder/tecaj-skupina.jpg",
  },
  {
    id: "training-program-performance",
    slug: "performance",
    name: "Performance program",
    shortDescription: "Dolgi potopi, specializirane plavuti in tekmovalno usmerjena priprava.",
    placementGuidance: "Za izkušene proste potapljače z dobro plavalno tehniko in željo po daljših potopih ali tekmovalni pripravi.",
    description: "Program vključuje dolge dinamične potope, stereo in mono plavuti, daljše O₂/CO₂ potope ter sistematično ciklizacijo.",
    equipment: "Kratke in dolge plavuti, mono plavut, dihalka, vratna utež, bazenski neopren in ščipalka za nos.",
    sortOrder: 3,
    image: "public/images/placeholder/trening-camp.jpg",
  },
  {
    id: "training-program-statika",
    slug: "statika",
    name: "Statična apnea",
    shortDescription: "Sproščanje in prilagajanje telesa na višji CO₂ ter nižji O₂ v mirovanju.",
    placementGuidance: "Primerno za rekreativne in vrhunske proste potapljače; predhodna tekmovalna izkušnja ni potrebna.",
    description: "Trening statike razvija sproščanje na vodni gladini, toleranco na CO₂ in O₂ ter sposobnost daljšega zadrževanja diha.",
    equipment: "Športne kopalke, očala ali maska, ščipalka za nos ter neopren debeline 3 mm ali več.",
    sortOrder: 4,
    image: "public/images/placeholder/tecaj-bled.png",
  },
  {
    id: "training-program-mladinska",
    slug: "mladinska",
    name: "Mladinska skupina",
    shortDescription: "Vodena vadba plavanja in prostega potapljanja za mlade.",
    placementGuidance: "Uvrstitev je odvisna od starosti, samostojnosti v vodi in predhodnih izkušenj; pred prijavo jo potrdi ekipa Apnea.si.",
    description: "Program mladim na varen in postopen način približa plavanje, dihanje in osnove prostega potapljanja.",
    equipment: "Oprema se potrdi glede na starost in skupino.",
    sortOrder: 5,
    image: "public/images/placeholder/tecaj-bazen-samo.png",
  },
];

const venues = [
  ["dif", "Fakulteta za šport", "Ljubljana", "Zaradi globine, ki na enem delu presega 3 m, je eden najbolj priljubljenih bazenov za tekmovalne proste potapljače. Nudi dobre pogoje za vse vrste vadbe.", "2025-10-06", "2026-06-12", 62, 310, 248, "public/images/placeholder/tecaj-bazen-samo.png"],
  ["tivoli", "Tivoli", "Ljubljana", "Veliki 25-metrski bazen s konstantno globino in velikim parkiriščem je od leta 2014 ena standardnih lokacij Apnea.si.", "2025-10-06", "2026-06-12", 60, 300, 240, "public/images/placeholder/tecaj-ljubljana.jpg"],
  ["ilirija", "Ilirija", "Ljubljana", "Novi športni center omogoča trening po širini velikega 50-metrskega bazena s konstantno globino 2,2 m.", "2025-10-06", "2026-06-12", 62, 310, 248, "public/images/placeholder/tecaj-bazen-samo.png"],
  ["vevce", "Vevče", "Ljubljana", "Nov 25-metrski bazen omogoča trening začetnih in nadaljevalnih skupin.", "2025-10-16", "2026-06-11", 62, 295, 248, "public/images/placeholder/tecaj-ljubljana.jpg"],
  ["kranj", "Kranj", "Kranj", "Olimpijski 50-metrski bazen nudi izjemne pogoje za začetne in tekmovalne skupine prostega potapljanja.", "2025-10-07", "2026-06-10", 54, 270, 216, "public/images/placeholder/tecaj-bazen-samo.png"],
  ["nova-gorica", "Nova Gorica", "Nova Gorica", "V novem 25-metrskem bazenu treningi potekajo od leta 2022. Bazen ima stojno višino na eni in globino dva metra na drugi strani.", "2025-10-14", "2026-05-27", 54, 270, 162, "public/images/placeholder/tecaj-ljubljana.jpg"],
  ["koper", "Koper", "Koper", "Novi olimpijski bazen je baza Apnea.si na Primorskem. Trening poteka v 25-metrskih progah s konstantno globino.", "2025-10-13", "2026-05-04", 54, 365, 0, "public/images/placeholder/tecaj-bazen-samo.png"],
  ["radovljica", "Radovljica", "Radovljica", "Pokrit 50-metrski bazen je baza Apnea.si na Gorenjskem in leži približno 30 minut vožnje iz Ljubljane.", "2025-10-06", "2026-05-18", 54, 270, 148.5, "public/images/placeholder/tecaj-ljubljana.jpg"],
  ["novo-mesto", "Novo mesto", "Novo mesto", "Novi 25-metrski bazen ima na eni strani stojno višino 135 cm, na drugi pa je globok dva metra.", "2025-10-14", "2026-05-26", 58, 275.5, 174, "public/images/placeholder/tecaj-bazen-samo.png"],
  ["velenje", "Velenje", "Velenje", "25-metrski bazen s konstantno globino 1,8 m leži v središču mesta.", "2025-10-20", "2026-05-25", 54, 243, 162, "public/images/placeholder/tecaj-ljubljana.jpg"],
].map(([slug, name, city, description, start, end, monthly, first, second, image], index) => ({
  id: `training-venue-${slug}`,
  slug,
  name,
  city,
  description,
  start,
  end,
  pricing: { monthlyDisplayPrice: monthly, firstInstallmentAmount: first, secondInstallmentAmount: second },
  image,
  sortOrder: index + 1,
}));

const groups = [
  ["dif", "ponedeljek", "07:00", "08:00", "zacetni"], ["dif", "ponedeljek", "07:00", "08:00", "nadaljevalni"], ["dif", "ponedeljek", "21:00", "22:00", "nadaljevalni"],
  ["tivoli", "ponedeljek", "17:00", "18:00", "mladinska"], ["tivoli", "ponedeljek", "18:00", "19:00", "zacetni"],
  ["ilirija", "ponedeljek", "20:00", "21:00", "nadaljevalni"], ["ilirija", "ponedeljek", "21:00", "22:00", "nadaljevalni"],
  ["koper", "ponedeljek", "19:00", "20:00", "zacetni"], ["koper", "ponedeljek", "20:00", "21:00", "nadaljevalni"],
  ["radovljica", "ponedeljek", "20:00", "21:00", "zacetni"], ["radovljica", "ponedeljek", "20:00", "21:00", "nadaljevalni"],
  ["velenje", "ponedeljek", "20:00", "21:00", "zacetni"], ["velenje", "ponedeljek", "20:00", "21:00", "nadaljevalni"],
  ["dif", "torek", "16:00", "17:00", "zacetni"], ["dif", "torek", "19:00", "20:00", "zacetni"], ["tivoli", "torek", "21:00", "22:00", "zacetni"],
  ["ilirija", "torek", "21:00", "22:00", "nadaljevalni"], ["novo-mesto", "torek", "19:00", "20:00", "zacetni"], ["novo-mesto", "torek", "20:00", "21:00", "nadaljevalni"],
  ["kranj", "torek", "20:00", "21:00", "performance"], ["kranj", "torek", "21:00", "22:00", "zacetni"],
  ["dif", "sreda", "07:00", "08:00", "nadaljevalni"], ["dif", "sreda", "20:00", "21:00", "nadaljevalni"],
  ["tivoli", "sreda", "20:00", "21:00", "zacetni"], ["tivoli", "sreda", "20:45", "21:45", "statika"], ["tivoli", "sreda", "21:00", "22:00", "zacetni"],
  ["ilirija", "sreda", "21:00", "22:00", "nadaljevalni"], ["kranj", "sreda", "18:00", "19:00", "zacetni"], ["kranj", "sreda", "19:00", "20:00", "nadaljevalni"],
  ["nova-gorica", "sreda", "20:00", "21:00", "zacetni"], ["nova-gorica", "sreda", "20:00", "21:00", "nadaljevalni"],
  ["dif", "cetrtek", "07:00", "08:00", "performance"], ["tivoli", "cetrtek", "20:00", "21:00", "nadaljevalni"], ["tivoli", "cetrtek", "21:00", "22:00", "zacetni"],
  ["vevce", "cetrtek", "20:00", "21:00", "zacetni"], ["vevce", "cetrtek", "21:00", "22:00", "zacetni"],
  ["dif", "petek", "07:00", "08:00", "zacetni"],
];

const imageRefs = new Map();
async function uploadImage(relativePath) {
  if (imageRefs.has(relativePath)) return imageRefs.get(relativePath);
  const asset = await sanity.assets.upload("image", createReadStream(resolve(root, relativePath)), {
    filename: relativePath.split("/").at(-1),
  });
  imageRefs.set(relativePath, asset._id);
  return asset._id;
}

const tx = sanity.transaction();
tx.createOrReplace({
  _id: "training-settings",
  _type: "trainingSettings",
  seasonLabel: "2026/27",
  applicationsOpen: false,
  membershipFee: 35,
  holdMinutes: 15,
});

for (const program of programs) {
  const assetId = await uploadImage(program.image);
  tx.createOrReplace({
    _id: program.id,
    _type: "trainingProgram",
    name: program.name,
    slug: { _type: "slug", current: program.slug },
    shortDescription: program.shortDescription,
    description: block(program.description),
    placementGuidance: program.placementGuidance,
    equipment: block(program.equipment),
    image: { _type: "image", asset: { _type: "reference", _ref: assetId }, alt: program.name },
    sortOrder: program.sortOrder,
    active: true,
  });
}

for (const venue of venues) {
  const assetId = await uploadImage(venue.image);
  tx.createOrReplace({
    _id: venue.id,
    _type: "trainingVenue",
    name: venue.name,
    city: venue.city,
    slug: { _type: "slug", current: venue.slug },
    description: venue.description,
    image: { _type: "image", asset: { _type: "reference", _ref: assetId }, alt: `Bazen ${venue.name}` },
    defaultStartDate: venue.start,
    defaultEndDate: venue.end,
    defaultPricing: venue.pricing,
    sortOrder: venue.sortOrder,
    active: true,
  });
}

for (const [venue, weekday, startTime, endTime, program] of groups) {
  tx.createOrReplace({
    _id: `training-group-${venue}-${weekday}-${startTime.replace(":", "")}-${program}`,
    _type: "trainingGroup",
    venue: { _type: "reference", _ref: `training-venue-${venue}` },
    program: { _type: "reference", _ref: `training-program-${program}` },
    weekday,
    startTime,
    endTime,
    capacity: program === "statika" ? 25 : 8,
    confirmedSpots: 0,
    holds: [],
    active: true,
  });
}

await tx.commit();
console.log(`Seeded ${programs.length} programs, ${venues.length} venues and ${groups.length} groups.`);
