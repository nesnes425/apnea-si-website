import { PortableText, type PortableTextComponents } from "@portabletext/react";
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "@/lib/sanity/client";
import Image from "next/image";
import Link from "next/link";

const builder = imageUrlBuilder(sanityClient);

function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="text-3xl font-bold mt-10 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-semibold mt-5 mb-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-semibold mt-4 mb-2">{children}</h5>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gold pl-4 italic my-6 text-muted-text">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => <p className="leading-relaxed mb-4">{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong className="text-navy font-semibold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="text-gold hover:text-gold-hover underline underline-offset-2 transition-colors"
        target={value?.href?.startsWith("http") ? "_blank" : undefined}
        rel={value?.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const url = urlFor(value).width(800).quality(85).auto("format").url();
      return (
        <figure className="my-8">
          <Image
            src={url}
            alt={value.alt || ""}
            width={800}
            height={500}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {value.alt && (
            <figcaption className="text-sm text-muted-text mt-2 text-center">
              {value.alt}
            </figcaption>
          )}
        </figure>
      );
    },
    cta: ({ value }) => {
      if (!value) return null;
      return (
        <div className="my-10 py-8 px-6 bg-surface border border-border-custom text-center">
          {value.heading && (
            <h3 className="text-xl font-semibold mb-2">{value.heading}</h3>
          )}
          {value.text && (
            <p className="text-body font-body mb-6">{value.text}</p>
          )}
          {value.buttons && value.buttons.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4">
              {value.buttons.map(
                (
                  btn: { label: string; href: string; variant?: string },
                  i: number
                ) => (
                  <Link
                    key={i}
                    href={btn.href}
                    className={
                      btn.variant === "secondary"
                        ? "no-underline px-6 py-3 text-sm font-body font-semibold border-2 border-navy !text-navy hover:bg-navy hover:!text-white transition-colors"
                        : "no-underline px-6 py-3 text-sm font-body font-semibold bg-gold !text-white hover:bg-gold-hover transition-colors"
                    }
                  >
                    {btn.label}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      );
    },
    youtube: ({ value }) => {
      if (!value?.videoId) return null;
      return (
        <div className="my-8 aspect-video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${value.videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
      );
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PortableTextRenderer({ value }: { value: any[] }) {
  return (
    <div className="prose-apnea">
      <PortableText value={value} components={components} />
    </div>
  );
}
