import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

const instagramImages = [
  {
    src: "/images/treningi-galerija-4.webp",
    alt: "Trening prostega potapljanja v bazenu",
  },
  {
    src: "/images/tecaji-zacetni-galerija-3.webp",
    alt: "Začetni tečaj prostega potapljanja v morju",
  },
  {
    src: "/images/onas-tekmovanje.webp",
    alt: "Apnea Slovenija na tekmovanju v prostem potapljanju",
  },
  {
    src: "/images/domov-samo-2.webp",
    alt: "Samo Jeranko med prostim potopom",
  },
];

export function InstagramFeed() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {instagramImages.map((image) => (
        <Link
          key={image.src}
          href={siteConfig.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-square overflow-hidden bg-navy"
          aria-label="Odpri Instagram profil Apnea.si"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-navy/0 transition-colors group-hover:bg-navy/20" />
        </Link>
      ))}
    </div>
  );
}
