import { cn } from '@/lib/cn';

type ProgressBarProps = {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  className?: string;
};

export function ProgressBar({ value, max, label, showValue = true, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between gap-2 text-xs text-muted">
          <span>{label}</span>
          {showValue && (
            <span className="tabular-nums">
              {value}/{max} · {percent}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className="h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
