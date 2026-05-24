import type { ComponentProps } from "react";

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`w-full min-h-[12rem] rounded-2xl bg-surface border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors font-mono leading-relaxed resize-y ${className}`}
      {...props}
    />
  );
}
