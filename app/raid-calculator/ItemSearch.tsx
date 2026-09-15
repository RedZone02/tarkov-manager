'use client';

import { useRef, useState } from 'react';
import { formatRoubles } from '@/lib/format';
import type { GameMode } from '@/lib/game-mode';
import type { ItemSummary } from '@/lib/tarkov/types';
import { ItemIcon } from '../components/ui/ItemIcon';
import { SearchInput } from '../components/ui/SearchInput';

type ItemSearchProps = {
  mode: GameMode;
  label: string;
  priceLabel: (item: ItemSummary) => number | null;
  onSelect: (item: ItemSummary) => void;
};

const DEBOUNCE_MS = 250;

export default function ItemSearch({ mode, label, priceLabel, onSelect }: ItemSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemSummary[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef<AbortController | null>(null);

  function search(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    request.current?.abort();

    if (value.trim().length < 2) {
      setResults([]);
      setState('idle');
      return;
    }

    setState('loading');
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const res = await fetch(`/api/items?mode=${mode}&q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Item search failed (${res.status})`);
        const body = (await res.json()) as { items: ItemSummary[] };
        setResults(body.items);
        setState('idle');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setResults([]);
        setState('error');
      }
    }, DEBOUNCE_MS);
  }

  function select(item: ItemSummary) {
    onSelect(item);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="relative">
      <SearchInput
        value={query}
        onChange={(e) => search(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setResults([]);
          if (e.key === 'Enter' && results[0]) {
            e.preventDefault();
            select(results[0]);
          }
        }}
        placeholder={label}
        aria-label={label}
        autoComplete="off"
      />
      <p className="sr-only" aria-live="polite">
        {state === 'loading' ? 'Searching' : results.length > 0 ? `${results.length} results` : ''}
      </p>
      {state === 'loading' && <p className="mt-1 text-xs text-muted">Searching…</p>}
      {state === 'error' && <p className="mt-1 text-xs text-accent">Item search is unavailable right now.</p>}
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => select(item)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2"
              >
                <ItemIcon src={item.iconLink} size={28} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-xs tabular-nums text-muted">{formatRoubles(priceLabel(item))}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
