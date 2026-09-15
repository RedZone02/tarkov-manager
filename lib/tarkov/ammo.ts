import type { GameMode } from '@/lib/game-mode';
import { getItemCatalog, toItemSummary } from './items';
import type { AmmoRound } from './types';

export async function getAmmo(mode: GameMode): Promise<AmmoRound[]> {
  const catalog = await getItemCatalog(mode);
  const rounds: AmmoRound[] = [];
  for (const item of catalog.values()) {
    if (item.ammo) rounds.push({ ...toItemSummary(item), ...item.ammo });
  }
  return rounds.sort((a, b) => a.caliber.localeCompare(b.caliber) || b.penetrationPower - a.penetrationPower);
}
