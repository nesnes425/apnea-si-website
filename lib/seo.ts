import type { Metadata } from "next";

const SITE_URL = "https://apnea.si";
const DEFAULT_IMAGE = "/images/og-default.jpg";
const DEFAULT_IMAGE_ALT = "Apnea Slovenija - tečaji in treningi prostega potapljanja";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
};

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  type = "website",
}: PageMetadataOptions): Metadata {
  const url = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      type,
      locale: "sl_SI",
      siteName: "Apnea Slovenija",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
