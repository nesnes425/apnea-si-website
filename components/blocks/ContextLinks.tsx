import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ContextLinksProps {
  children: ReactNode;
  surface?: boolean;
}

export function ContextLinks({ children, surface = false }: ContextLinksProps) {
  return (
    <section className={cn("pb-20", surface && "bg-surface")}>
      <div className="mx-auto max-w-3xl px-6">
        <p className="border-t border-border-custom pt-6 text-center text-[15px] leading-[1.7] text-muted-text font-body">
          {children}
        </p>
      </div>
    </section>
  );
}
