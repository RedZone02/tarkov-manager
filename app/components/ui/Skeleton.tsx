import { cn } from '@/lib/cn';
import { Page } from './Page';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-2', className)} />;
}

export function PageSkeleton() {
  return (
    <Page>
      <p role="status" className="sr-only">
        Loading game data…
      </p>
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-[32rem] max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    </Page>
  );
}
