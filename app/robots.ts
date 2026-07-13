import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/studio/",
          "/tecaji/*/prijava",
          "/tecaji/hvala",
          "/darilni-bon/hvala",
        ],
      },
    ],
    sitemap: "https://www.apnea.si/sitemap.xml",
    host: "https://www.apnea.si",
  };
}
