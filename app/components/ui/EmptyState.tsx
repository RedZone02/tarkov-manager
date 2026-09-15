import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: string;
  title: string;
  children?: ReactNode;
};

export function EmptyState({ icon = '🔍', title, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <span aria-hidden className="text-3xl">
        {icon}
      </span>
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}
