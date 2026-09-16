import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TextFieldProps = ComponentProps<'input'> & {
  id: string;
  label: string;
  hint?: ReactNode;
  labelAction?: ReactNode;
};

export function TextField({ id, label, hint, labelAction, className, ...props }: TextFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-muted"
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
