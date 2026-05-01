import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, id, className, ...rest }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-navy font-body mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-errormessage={error ? errorId : undefined}
          className={cn(
            "w-full px-4 py-3 border bg-white text-navy font-body transition-colors focus:outline-none",
            error
              ? "border-red-700 focus:border-red-700"
              : "border-border-custom focus:border-gold",
            className
          )}
          {...rest}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-red-700 mt-1 font-body"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
