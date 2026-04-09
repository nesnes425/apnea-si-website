import { siteConfig } from "@/lib/config";
import { Overline } from "./Overline";
import { SectionHeading } from "./SectionHeading";

interface Review {
  text: string;
  name: string;
  detail: string;
}

interface TestimonialsProps {
  reviews: Review[];
  overline?: string;
  heading?: string;
}

export function Testimonials({
  reviews,
  overline = "Mnenja tečajnikov",
  heading = "Kaj pravijo naši tečajniki",
}: TestimonialsProps) {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <Overline>{overline}</Overline>
        <SectionHeading className="mb-14">{heading}</SectionHeading>

        <div className="grid md:grid-cols-3 gap-10">
          {reviews.map((review) => (
            <div key={review.name}>
              <div className="flex gap-1 text-gold mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[16px] text-body leading-[1.7] font-body mb-6">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="border-t border-border-custom pt-4">
                <p className="text-[15px] font-medium text-navy font-body">
                  {review.name}
                </p>
                <p className="text-sm text-muted-text font-body">
                  {review.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-text font-body">
          {siteConfig.stats.googleReviews} ocen na Google ·{" "}
          {siteConfig.stats.googleRating} ★ povprečna ocena
        </p>
      </div>
    </section>
  );
}
