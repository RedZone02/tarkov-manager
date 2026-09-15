import type { ReactNode } from 'react';

type PageHeaderProps = {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function PageHeader({ icon, title, description, children }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <span aria-hidden>{icon}</span>
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">{description}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}
