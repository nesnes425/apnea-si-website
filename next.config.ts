import type { NextConfig } from "next";

// === Manual redirects ===
// Static page renames + WP-specific URLs that don't follow the date-prefix pattern.
const manualRedirects: { source: string; destination: string }[] = [
  // Old WP page slugs → new equivalents
  { source: "/aktivnosti", destination: "/tecaji" },
  { source: "/aktivnosti/", destination: "/tecaji" },
  { source: "/prijava", destination: "/tecaji/zacetni" },
  { source: "/prijava/", destination: "/tecaji/zacetni" },
  { source: "/prijava-na-trening-prostega-potapljanja", destination: "/treningi" },
  { source: "/prijava-na-trening-prostega-potapljanja/", destination: "/treningi" },
  { source: "/prijava-na-nadomestni-trening", destination: "/treningi" },
  { source: "/prijava-na-nadomestni-trening/", destination: "/treningi" },
  { source: "/pogosto-zastavljena-vprasanja", destination: "/vprasanja" },
  { source: "/pogosto-zastavljena-vprasanja/", destination: "/vprasanja" },
  { source: "/pogoji-poslovanja", destination: "/pogoji" },
  { source: "/pogoji-poslovanja/", destination: "/pogoji" },
  { source: "/samo-jeranko", destination: "/o-nas" },
  { source: "/samo-jeranko/", destination: "/o-nas" },
  { source: "/nadaljevalni-tecaji", destination: "/tecaji/nadaljevalni" },
  { source: "/nadaljevalni-tecaji/", destination: "/tecaji/nadaljevalni" },
  { source: "/galerija", destination: "/" },
  { source: "/galerija/", destination: "/" },
  { source: "/o-prostem-potapljanju-z-druzbo-eles", destination: "/predavanja" },
  { source: "/o-prostem-potapljanju-z-druzbo-eles/", destination: "/predavanja" },
  { source: "/apnea-slovenija-trening-plan", destination: "/treningi" },
  { source: "/apnea-slovenija-trening-plan/", destination: "/treningi" },
  { source: "/freedive-yachting", destination: "/o-nas" },
  { source: "/freedive-yachting/", destination: "/o-nas" },
  { source: "/meditacije-in-mentalna-priprava-za-prosto-potapljanje", destination: "/treningi" },
  { source: "/meditacije-in-mentalna-priprava-za-prosto-potapljanje/", destination: "/treningi" },
  { source: "/road-to-vertical-blue-2018", destination: "/novice" },
  { source: "/road-to-vertical-blue-2018/", destination: "/novice" },
  { source: "/chronosly-base", destination: "/" },
  { source: "/chronosly-base/", destination: "/" },
  { source: "/404-2", destination: "/" },
  { source: "/404-2/", destination: "/" },
  { source: "/no-access", destination: "/" },
  { source: "/no-access/", destination: "/" },

  // /prosto-potapljanje/ — placeholder until the SEO authority page exists
  { source: "/prosto-potapljanje", destination: "/tecaji/zacetni" },
  { source: "/prosto-potapljanje/", destination: "/tecaji/zacetni" },
];

// === Path-pattern redirects ===
const patternRedirects: { source: string; destination: string }[] = [
  // WooCommerce — no longer a shop
  { source: "/shop", destination: "/" },
  { source: "/shop/:path*", destination: "/" },
  { source: "/cart", destination: "/" },
  { source: "/cart/:path*", destination: "/" },
  { source: "/checkout", destination: "/" },
  { source: "/checkout/:path*", destination: "/" },
  { source: "/my-account", destination: "/" },
  { source: "/my-account/:path*", destination: "/" },

  // WP categories → blog index
  { source: "/category/:path*", destination: "/novice" },

  // Author + tag archives → blog index
  { source: "/author/:path*", destination: "/novice" },
  { source: "/tag/:path*", destination: "/novice" },

  // Old event listings (Chronosly + MEC)
  { source: "/events", destination: "/tecaji" },
  { source: "/events/:path*", destination: "/tecaji" },
  { source: "/eventi", destination: "/tecaji" },
  { source: "/eventi/:path*", destination: "/tecaji" },
  { source: "/all-events", destination: "/tecaji" },
  { source: "/all-events/:path*", destination: "/tecaji" },
];

async function getMigratedSlugs(): Promise<string[]> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    console.warn("Sanity env vars missing at build time; skipping per-post blog redirects.");
    return [];
  }

  const query = encodeURIComponent('*[_type == "blogPost" && defined(slug.current)]{"slug": slug.current}');
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Sanity query failed (${res.status}); skipping per-post blog redirects.`);
      return [];
    }
    const json = (await res.json()) as { result?: { slug: string }[] };
    return json.result?.map((p) => p.slug) ?? [];
  } catch (err) {
    console.warn("Could not fetch Sanity slugs at build time; skipping per-post blog redirects.", err);
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // Let our redirect rules see the URL as-is (with/without trailing slash).
  // Otherwise Next.js strips trailing slashes first, which would 2-hop old
  // /aktivnosti/-style URLs through an intermediate redirect.
  skipTrailingSlashRedirect: true,
  async redirects() {
    const migratedSlugs = await getMigratedSlugs();

    // Per-post: /YYYY/MM/DD/<slug>/ → /novice/<slug>
    const blogRedirects = migratedSlugs.flatMap((slug) => [
      {
        source: `/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/${slug}`,
        destination: `/novice/${slug}`,
        permanent: true,
      },
      {
        source: `/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/${slug}/`,
        destination: `/novice/${slug}`,
        permanent: true,
      },
    ]);

    return [
      ...manualRedirects.map((r) => ({ ...r, permanent: true })),
      ...patternRedirects.map((r) => ({ ...r, permanent: true })),
      ...blogRedirects,
      // Catch-all for non-migrated date-prefixed posts → blog index.
      // Comes after the per-post redirects above; Next.js applies redirects in order.
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug",
        destination: "/novice",
        permanent: true,
      },
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug/",
        destination: "/novice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
