import { siteConfig } from "@/lib/config";
import type { Testimonial } from "@/lib/testimonials";
import { SectionHeading } from "./SectionHeading";

type GoogleTestimonialsProps = {
  reviews: Testimonial[];
};

export function GoogleTestimonials({ reviews }: GoogleTestimonialsProps) {
  return (
    <section className="bg-surface py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body mb-4">
              Mnenja tečajnikov
            </p>
            <SectionHeading>Kaj pravijo ljudje po tečaju</SectionHeading>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="inline-flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
              <span className="text-[26px] font-semibold leading-none text-navy font-heading">
                {siteConfig.stats.googleRating}
              </span>
              <span className="flex flex-col">
                <span className="text-sm leading-none text-gold" aria-label="5 od 5 zvezdic">
                  ★★★★★
                </span>
                <span className="mt-1 text-xs text-muted-text font-body">
                  {siteConfig.stats.googleReviews} Google ocen
                </span>
              </span>
            </div>
            <a
              href={siteConfig.social.googleReviews}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-gold font-medium font-body hover:text-gold-hover transition-colors"
            >
              Vse Google ocene →
            </a>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="flex min-h-[260px] flex-col bg-white p-7 shadow-sm ring-1 ring-border-custom/70"
            >
              <div className="mb-5 flex gap-0.5 text-gold" aria-label="5 od 5 zvezdic">
                {[...Array(5)].map((_, index) => (
                  <span key={index} className="text-sm" aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>

              <p className="text-[16px] text-body font-body leading-[1.75]">
                &ldquo;{review.text}&rdquo;
              </p>

              <div className="mt-auto border-t border-border-custom pt-5">
                <p className="text-[14px] text-navy font-semibold font-body">{review.name}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
