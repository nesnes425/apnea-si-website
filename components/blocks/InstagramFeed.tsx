import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

const instagramImages = [
  {
    src: "/images/domov-hero.webp",
    alt: "Prosti potapljač pod morsko gladino",
  },
  {
    src: "/images/treningi-galerija-4.webp",
    alt: "Trening prostega potapljanja v bazenu",
  },
  {
    src: "/images/tecaji-zacetni-galerija-3.webp",
    alt: "Udeleženci začetnega tečaja prostega potapljanja v morju",
  },
  {
    src: "/images/domov-samo-2.webp",
    alt: "Samo Jeranko med prostim potopom",
  },
  {
    src: "/images/onas-tekmovanje.webp",
    alt: "Apnea Slovenija na tekmovanju v prostem potapljanju",
  },
  {
    src: "/images/treningi-galerija-1.webp",
    alt: "Plavalni trening za proste potapljače",
  },
  {
    src: "/images/tecaji-nadaljevalni-galerija-5.webp",
    alt: "Nadaljevalni tečaj prostega potapljanja na morju",
  },
  {
    src: "/images/onas-samo.webp",
    alt: "Samo Jeranko, inštruktor prostega potapljanja",
  },
  {
    src: "/images/treningi-galerija-7.webp",
    alt: "Skupinski trening prostega potapljanja",
  },
  {
    src: "/images/prosto-potapljanje-pod-gladino.webp",
    alt: "Potapljač na vdih pod gladino",
  },
  {
    src: "/images/tecaji-zacetni-galerija-7.webp",
    alt: "Vaja varnosti na začetnem tečaju prostega potapljanja",
  },
  {
    src: "/images/domov-samo-3.webp",
    alt: "Samo Jeranko ob morju",
  },
  {
    src: "/images/treningi-galerija-8.webp",
    alt: "Bazenski trening zadrževanja diha",
  },
  {
    src: "/images/tecaji-master-hero.webp",
    alt: "Napredni prosti potop v modrini",
  },
  {
    src: "/images/onas-matevz.webp",
    alt: "Član ekipe Apnea Slovenija",
  },
  {
    src: "/images/tecaji-nadaljevalni-galerija-9.webp",
    alt: "Tečajniki prostega potapljanja v vodi",
  },
];

function visibilityClass(index: number) {
  if (index >= 12) return "hidden xl:block";
  if (index >= 8) return "hidden lg:block";
  if (index >= 6) return "hidden sm:block";
  return "";
}

export function InstagramFeed() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:grid-cols-8">
      {instagramImages.map((image, index) => (
        <Link
          key={image.src}
          href={siteConfig.social.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={`group relative aspect-square overflow-hidden bg-navy ${visibilityClass(index)}`}
          aria-label="Odpri Instagram profil Apnea.si"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 12.5vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-navy/0 transition-colors group-hover:bg-navy/20" />
        </Link>
      ))}
    </div>
  );
}
