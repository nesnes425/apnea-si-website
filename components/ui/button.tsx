import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary";
type ButtonSize = "xl" | "lg" | "sm";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  asChild?: boolean;
};

function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean,
  extra?: string
): string {
  return cn(
    "transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
    variant === "primary" &&
      "bg-gold text-white font-medium font-body hover:bg-gold-hover",
    size === "xl" && "px-10 py-4 text-[16px] tracking-[0.02em]",
    size === "lg" && "px-8 py-4 text-[15px] tracking-[0.02em]",
    size === "sm" && "px-6 py-2.5 text-[14px]",
    fullWidth ? "w-full" : "inline-block shrink-0",
    extra
  );
}

export function Button({
  variant = "primary",
  size = "lg",
  fullWidth = false,
  asChild = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = buttonClasses(variant, size, fullWidth, className);

  if (asChild && React.isValidElement(children)) {
    type ChildProps = { className?: string };
    const child = children as React.ReactElement<ChildProps>;
    return React.cloneElement(child, {
      className: cn(child.props.className, classes),
    });
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
