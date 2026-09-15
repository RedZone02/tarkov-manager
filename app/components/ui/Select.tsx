import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Select({ label, className, children, ...props }: ComponentProps<'select'> & { label: string }) {
  return (
    <label className={cn('flex flex-col gap-1 text-xs font-medium text-muted', className)}>
      {label}
      <select className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text" {...props}>
        {children}
      </select>
    </label>
  );
}
