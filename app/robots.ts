import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/studio/", "/tecaji/*/prijava", "/tecaji/hvala"],
      },
    ],
    sitemap: "https://apnea.si/sitemap.xml",
    host: "https://apnea.si",
  };
}
