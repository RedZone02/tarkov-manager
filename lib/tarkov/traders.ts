import type { GameMode } from '@/lib/game-mode';
import { loadRaw, memoize, translate } from './source';
import type { Trader } from './types';

type RawTrader = {
  id: string;
  name: string;
  normalizedName: string;
  imageLink: string | null;
  levels: unknown[];
};

export function getTraders(mode: GameMode): Promise<Trader[]> {
  return memoize(`${mode}:traders`, async () => {
    const { data, locale } = await loadRaw<Record<string, RawTrader>>(mode, 'traders');
    return Object.values(data).map((raw) => ({
      id: raw.id,
      name: translate(locale, raw.name),
      normalizedName: raw.normalizedName,
      imageLink: raw.imageLink ?? '',
      maxLevel: raw.levels.length,
    }));
  });
}
