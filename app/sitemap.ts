import type { MetadataRoute } from "next";
import { sanityClient } from "@/lib/sanity/client";

const SITE_URL = "https://apnea.si";

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/tecaji", changeFrequency: "weekly", priority: 0.9 },
  { path: "/tecaji/zacetni", changeFrequency: "weekly", priority: 0.9 },
  { path: "/tecaji/nadaljevalni", changeFrequency: "monthly", priority: 0.8 },
  { path: "/tecaji/master", changeFrequency: "monthly", priority: 0.8 },
  { path: "/treningi", changeFrequency: "monthly", priority: 0.9 },
  { path: "/darilni-bon", changeFrequency: "monthly", priority: 0.7 },
  { path: "/predavanja", changeFrequency: "monthly", priority: 0.6 },
  { path: "/o-nas", changeFrequency: "monthly", priority: 0.7 },
  { path: "/kontakt", changeFrequency: "yearly", priority: 0.5 },
  { path: "/vprasanja", changeFrequency: "monthly", priority: 0.6 },
  { path: "/novice", changeFrequency: "weekly", priority: 0.7 },
  { path: "/pogoji", changeFrequency: "yearly", priority: 0.3 },
  { path: "/zasebnost", changeFrequency: "yearly", priority: 0.3 },
];

type SanityPostEntry = { slug: string; publishedAt?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const posts = await sanityClient.fetch<SanityPostEntry[]>(
    `*[_type == "blogPost" && defined(slug.current)] {
      "slug": slug.current,
      publishedAt
    }`
  );

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/novice/${p.slug}`,
    lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  return [...staticEntries, ...blogEntries];
}
