'use client';

import { useEffect } from 'react';
import { Button } from './ui/Button';
import { Page } from './ui/Page';

type DataErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function DataError({ error, retry }: DataErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page>
      <div
        role="alert"
        className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-12 text-center"
      >
        <span aria-hidden className="text-4xl">
          📡
        </span>
        <h1 className="text-xl font-semibold">Game data is unavailable</h1>
        <p className="text-sm text-muted">
          We couldn&apos;t load data from tarkov.dev. It may be temporarily down. Your saved progress is safe in this
          browser.
        </p>
        <Button variant="primary" onClick={() => retry()}>
          Try again
        </Button>
      </div>
    </Page>
  );
}
