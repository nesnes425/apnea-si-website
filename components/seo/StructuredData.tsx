import { siteConfig } from "@/lib/config";

type JsonLd = Record<string, unknown>;

function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = "https://apnea.si";

export function LocalBusinessJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}#localbusiness`,
        name: "Apnea Slovenija",
        description: siteConfig.description,
        url: SITE_URL,
        email: siteConfig.email,
        telephone: siteConfig.phone,
        image: `${SITE_URL}/images/og-default.jpg`,
        sameAs: [
          siteConfig.social.instagram,
          siteConfig.social.facebook,
          siteConfig.social.linkedin,
        ],
        areaServed: { "@type": "Country", name: "Slovenija" },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: siteConfig.stats.googleRating,
          reviewCount: siteConfig.stats.googleReviews.replace(/\D/g, "") || "245",
        },
      }}
    />
  );
}

export function PersonSamoJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `${SITE_URL}/o-nas#samo-jeranko`,
        name: "Samo Jeranko",
        jobTitle: "Inštruktor prostega potapljanja",
        url: `${SITE_URL}/o-nas`,
        image: `${SITE_URL}/images/placeholder/samo-portrait.jpg`,
        worksFor: { "@id": `${SITE_URL}#localbusiness` },
        sameAs: [
          siteConfig.social.instagram,
          siteConfig.social.linkedin,
        ],
        award: [
          "10x medalja na svetovnem prvenstvu",
          "19x državni rekord",
          "SSI Freediving Instructor Trainer",
        ],
      }}
    />
  );
}

type CourseJsonLdProps = {
  name: string;
  description: string;
  url: string;
  priceInEuros: number;
};

export function CourseJsonLd({ name, description, url, priceInEuros }: CourseJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name,
        description,
        url,
        provider: { "@id": `${SITE_URL}#localbusiness` },
        offers: {
          "@type": "Offer",
          price: String(priceInEuros),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url,
        },
        inLanguage: "sl",
      }}
    />
  );
}

export function FAQPageJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }}
    />
  );
}
