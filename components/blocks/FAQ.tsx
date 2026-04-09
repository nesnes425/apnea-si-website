import { Overline } from "./Overline";
import { SectionHeading } from "./SectionHeading";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FAQItem[];
  overline?: string;
  heading?: string;
  surface?: boolean;
}

export function FAQ({
  items,
  overline = "Pogosta vprašanja",
  heading = "Imate vprašanje?",
  surface = false,
}: FAQProps) {
  return (
    <section className={`py-24 ${surface ? "bg-surface" : ""}`}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <Overline>{overline}</Overline>
          <SectionHeading center>{heading}</SectionHeading>
        </div>

        <div className="space-y-0">
          {items.map((faq) => (
            <details
              key={faq.q}
              className="group border-b border-border-custom"
            >
              <summary className="flex items-center justify-between py-6 cursor-pointer list-none">
                <span className="text-[17px] font-medium text-navy font-body pr-8">
                  {faq.q}
                </span>
                <span className="text-gold text-xl shrink-0 group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="pb-6 text-[16px] text-body leading-[1.7] font-body">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
