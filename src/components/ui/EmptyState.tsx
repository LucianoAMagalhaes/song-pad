import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-2xl font-bold text-foreground mb-2">{title}</div>
      {description ? <p className="text-muted max-w-md mb-6">{description}</p> : null}
      {action}
    </div>
  );
}
