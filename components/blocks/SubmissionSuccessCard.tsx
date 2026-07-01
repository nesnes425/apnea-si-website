import type { ReactNode } from "react";
import { Check } from "lucide-react";

type SubmissionSuccessCardProps = {
  title: string;
  children: ReactNode;
  steps: ReactNode[];
};

export function SubmissionSuccessCard({ title, children, steps }: SubmissionSuccessCardProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4">
        <Check aria-hidden="true" className="h-7 w-7 shrink-0 text-green-700" strokeWidth={2} />
        <h2 className="font-heading text-[26px] font-semibold leading-tight text-green-700">
          {title}
        </h2>
      </div>
      <div className="font-body text-body leading-relaxed">{children}</div>

      <div className="mt-8 border-t border-border-custom pt-6">
        <p className="mb-4 font-body text-[15px] font-medium text-navy">
          Kaj sledi?
        </p>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-3 font-body text-[15px] leading-relaxed text-body">
              <span className="mt-0.5 w-5 shrink-0 text-sm font-medium text-muted-text">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
