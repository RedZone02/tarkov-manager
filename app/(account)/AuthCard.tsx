import type { ReactNode } from 'react';
import { Card } from '../components/ui/Card';

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <div className="mt-6">{children}</div>
      </Card>
      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  );
}

export function AccountsUnavailable() {
  return (
    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
      Accounts aren&apos;t set up on this site yet. Your progress is still saved in this browser.
    </p>
  );
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
