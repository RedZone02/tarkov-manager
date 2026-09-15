import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ToggleOption<T extends string> = {
  value: T;
  label: ReactNode;
  count?: number;
};

type ToggleGroupProps<T extends string> = {
  label: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function ToggleGroup<T extends string>({ label, options, value, onChange, className }: ToggleGroupProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-accent text-on-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn('text-xs tabular-nums', active ? 'opacity-80' : 'text-muted')}>{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
