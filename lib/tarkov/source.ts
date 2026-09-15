import type { GameMode } from '@/lib/game-mode';

const BASE_URL = process.env.TARKOV_DATA_URL ?? 'https://json.tarkov.dev';
const TTL_MS = 60 * 60 * 1000;

export type Locale = Record<string, string>;

type CacheEntry = { expires: number; promise: Promise<unknown> };

const cache = new Map<string, CacheEntry>();

export function memoize<T>(key: string, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.promise as Promise<T>;

  const promise = load();
  cache.set(key, { expires: now + TTL_MS, promise });
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });
  return promise;
}

async function fetchData<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`tarkov.dev request failed: /${path} (${res.status})`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export async function loadRaw<T>(mode: GameMode, file: string): Promise<{ data: T; locale: Locale }> {
  const [data, locale] = await Promise.all([fetchData<T>(`${mode}/${file}`), fetchData<Locale>(`${mode}/${file}_en`)]);
  return { data, locale };
}

export function translate(locale: Locale, key: string | null | undefined): string {
  if (!key) return '';
  return locale[key] ?? key;
}
