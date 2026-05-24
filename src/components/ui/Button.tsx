import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-black hover:bg-accent-hover focus-visible:outline-accent",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-hover focus-visible:outline-foreground",
  ghost: "bg-transparent text-foreground hover:bg-surface-hover focus-visible:outline-foreground",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

type ButtonProps = CommonProps & ComponentProps<"button">;
type LinkButtonProps = CommonProps & ComponentProps<typeof Link>;

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
