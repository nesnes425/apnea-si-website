import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  /** Use surface background instead of white */
  surface?: boolean;
  /** Override max-width container (e.g., for narrower FAQ sections) */
  maxWidth?: "default" | "narrow";
}

export function Section({
  children,
  id,
  className,
  surface = false,
  maxWidth = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-24", surface && "bg-surface", className)}
    >
      <div
        className={cn(
          "mx-auto px-6",
          maxWidth === "narrow" ? "max-w-3xl" : "max-w-6xl"
        )}
      >
        {children}
      </div>
    </section>
  );
}
