import Image from "next/image";
import { Button } from "@/components/ui/button";

interface FinalCTAProps {
  heading: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImage?: string;
}

export function FinalCTA({
  heading,
  description,
  buttonText = "Rezervirajte svoje mesto →",
  buttonHref = "#termini",
  backgroundImage = "/images/placeholder/tecaj-morje.png",
}: FinalCTAProps) {
  return (
    <section className="relative w-full py-24 md:py-32">
      <Image
        src={backgroundImage}
        alt=""
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-navy/85" />
      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-[32px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.02em] text-white mb-6 font-heading">
          {heading}
        </h2>
        <p className="text-[18px] md:text-[20px] text-white/70 font-body mb-10 max-w-2xl mx-auto">
          {description}
        </p>
        <Button asChild size="xl">
          <a href={buttonHref}>{buttonText}</a>
        </Button>
      </div>
    </section>
  );
}
