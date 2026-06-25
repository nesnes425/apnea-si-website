import { siteConfig } from "@/lib/config";
import type { Testimonial } from "@/lib/testimonials";

type GoogleTestimonialsProps = {
  reviews: Testimonial[];
};

export function GoogleTestimonials({ reviews }: GoogleTestimonialsProps) {
  return (
    <section className="bg-surface py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-gold font-body">
            {siteConfig.stats.googleReviews} ocen na Google · {siteConfig.stats.googleRating} ★
          </p>
          <a
            href={siteConfig.social.googleReviews}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] text-gold font-medium font-body hover:text-gold-hover transition-colors"
          >
            Preberite vse ocene na Google →
          </a>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="bg-white p-6 border-l-2 border-gold/30">
              <div className="flex gap-0.5 text-gold mb-3" aria-label="5 od 5 zvezdic">
                {[...Array(5)].map((_, index) => (
                  <span key={index} className="text-sm" aria-hidden="true">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[15px] text-body font-body leading-relaxed mb-4">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="border-t border-border-custom pt-4">
                <p className="text-[13px] text-navy font-medium font-body">{review.name}</p>
                {review.detail && (
                  <p className="mt-1 text-xs text-muted-text font-body">{review.detail}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
