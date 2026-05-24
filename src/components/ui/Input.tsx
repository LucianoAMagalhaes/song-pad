import type { ComponentProps } from "react";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full h-11 rounded-full bg-surface border border-border px-5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${className}`}
      {...props}
    />
  );
}
