import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'default' | 'success' | 'accent' | 'warning';

const tones: Record<Tone, string> = {
  default: 'text-text',
  success: 'text-success',
  accent: 'text-accent',
  warning: 'text-warning',
};

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
};

export function StatTile({ label, value, hint, tone = 'default' }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
