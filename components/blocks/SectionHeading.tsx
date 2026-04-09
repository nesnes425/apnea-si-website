import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  center?: boolean;
}

export function SectionHeading({
  children,
  className,
  center = false,
}: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-[32px] md:text-[40px] font-semibold leading-[1.15] tracking-[-0.01em]",
        center && "text-center",
        className
      )}
    >
      {children}
    </h2>
  );
}
