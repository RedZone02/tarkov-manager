import type { GameMode } from '@/lib/game-mode';
import { loadRaw, memoize, translate } from './source';
import type { MapInfo, Position } from './types';

type RawMap = {
  id: string;
  name: string;
  normalizedName: string;
  wiki: string | null;
  raidDuration: number | null;
  players: string | null;
  bosses: { mob: string; spawnChance: number }[];
  extracts: { id: string; name: string; faction: string; position: Position | null }[];
  spawns: { position: Position; sides: string[]; categories: string[]; zoneName: string }[];
};

type RawMapsFile = {
  maps: Record<string, RawMap>;
  mobs: Record<string, { name: string }>;
};

const HIDDEN_MAPS = new Set(['ground-zero-tutorial']);

export function getMaps(mode: GameMode): Promise<MapInfo[]> {
  return memoize(`${mode}:maps`, async () => {
    const { data, locale } = await loadRaw<RawMapsFile>(mode, 'maps');

    return Object.values(data.maps)
      .filter((map) => !HIDDEN_MAPS.has(map.normalizedName))
      .map((map) => {
        const bosses = new Map<string, number>();
        for (const boss of map.bosses) {
          const name = translate(locale, data.mobs[boss.mob]?.name ?? boss.mob);
          bosses.set(name, Math.max(bosses.get(name) ?? 0, boss.spawnChance));
        }

        return {
          id: map.id,
          name: translate(locale, map.name),
          normalizedName: map.normalizedName,
          raidDuration: map.raidDuration,
          players: map.players,
          wiki: map.wiki,
          bosses: [...bosses]
            .map(([name, spawnChance]) => ({ name, spawnChance }))
            .sort((a, b) => b.spawnChance - a.spawnChance),
          extracts: map.extracts.map((extract) => ({
            id: extract.id,
            name: translate(locale, extract.name),
            faction: extract.faction,
            position: extract.position,
          })),
          spawns: map.spawns
            .filter((spawn) => spawn.categories.includes('player') && (spawn.sides.includes('pmc') || spawn.sides.includes('all')))
            .map((spawn) => ({ position: spawn.position, zoneName: spawn.zoneName })),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function getMapNames(mode: GameMode): Promise<Record<string, string>> {
  const maps = await getMaps(mode);
  return Object.fromEntries(maps.map((map) => [map.id, map.name]));
}
