import { siteConfig } from "@/lib/config";

interface Stat {
  number: string;
  label: string;
}

interface SocialProofBarProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  { number: siteConfig.stats.diversTrained, label: "potapljačev" },
  {
    number: `${siteConfig.stats.googleReviews} ocen`,
    label: `${siteConfig.stats.googleRating} ★ na Google`,
  },
  { number: siteConfig.stats.yearsExperience, label: "let izkušenj" },
  { number: "5", label: "lokacij po Sloveniji" },
];

export function SocialProofBar({ stats = defaultStats }: SocialProofBarProps) {
  return (
    <section className="bg-surface">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="py-6 md:py-8 px-6 text-center">
            <p className="text-[24px] md:text-[28px] font-bold text-gold font-heading">
              {stat.number}
            </p>
            <p className="text-xs md:text-sm text-muted-text font-body mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
