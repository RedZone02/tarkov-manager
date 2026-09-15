import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn('mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10', className)}>
      {children}
    </main>
  );
}
