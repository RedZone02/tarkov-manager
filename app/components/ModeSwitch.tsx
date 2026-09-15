'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { GAME_MODE_COOKIE, parseGameMode, type GameMode } from '@/lib/game-mode';

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readMode(): GameMode {
  const match = document.cookie.match(new RegExp(`(?:^|; )${GAME_MODE_COOKIE}=([^;]*)`));
  return parseGameMode(match?.[1]);
}

function writeMode(mode: GameMode) {
  document.cookie = `${GAME_MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
}

const getServerMode = (): GameMode => 'regular';

const modes: { value: GameMode; label: string }[] = [
  { value: 'regular', label: 'PvP' },
  { value: 'pve', label: 'PvE' },
];

export default function ModeSwitch({ className }: { className?: string }) {
  const router = useRouter();
  const mode = useSyncExternalStore(subscribe, readMode, getServerMode);
  const [isPending, startTransition] = useTransition();

  function select(next: GameMode) {
    if (next === mode) return;
    writeMode(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label="Game mode"
      aria-busy={isPending}
      className={cn('inline-flex rounded-lg border border-border bg-surface p-0.5', isPending && 'opacity-60', className)}
    >
      {modes.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={m.value === mode}
          onClick={() => select(m.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            m.value === mode ? 'bg-accent text-on-accent' : 'text-muted hover:text-text',
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
