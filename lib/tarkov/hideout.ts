import type { GameMode } from '@/lib/game-mode';
import { getItemCatalog } from './items';
import { loadRaw, memoize, translate } from './source';
import { getTraders } from './traders';
import type { HideoutStation } from './types';

type RawHideoutLevel = {
  level: number;
  constructionTime: number;
  traderRequirements: { trader: string; requirementType: string; value: number }[];
  stationLevelRequirements: { station: string; level: number }[];
  itemRequirements: { item: string; count: number; attributes?: { foundInRaid?: boolean } }[];
};

type RawStation = {
  id: string;
  name: string;
  normalizedName: string;
  imageLink: string | null;
  levels: RawHideoutLevel[];
};

export function getHideout(mode: GameMode): Promise<HideoutStation[]> {
  return memoize(`${mode}:hideout`, async () => {
    const [{ data, locale }, catalog, traders] = await Promise.all([
      loadRaw<Record<string, RawStation>>(mode, 'hideout'),
      getItemCatalog(mode),
      getTraders(mode),
    ]);
    const stationNames = new Map(Object.values(data).map((s) => [s.id, translate(locale, s.name)]));
    const traderNames = new Map(traders.map((t) => [t.id, t.name]));

    return Object.values(data)
      .map((station) => ({
        id: station.id,
        name: stationNames.get(station.id) ?? station.normalizedName,
        normalizedName: station.normalizedName,
        imageLink: station.imageLink ?? '',
        levels: station.levels
          .map((level) => ({
            level: level.level,
            constructionTime: level.constructionTime,
            items: level.itemRequirements.map((req) => {
              const item = catalog.get(req.item);
              return {
                itemId: req.item,
                name: item?.name ?? req.item,
                shortName: item?.shortName ?? '',
                iconLink: item?.iconLink ?? '',
                count: req.count,
                foundInRaid: req.attributes?.foundInRaid ?? false,
                unitPrice: item?.unitPrice ?? null,
              };
            }),
            stations: level.stationLevelRequirements.map((req) => ({
              stationId: req.station,
              name: stationNames.get(req.station) ?? req.station,
              level: req.level,
            })),
            traders: level.traderRequirements
              .filter((req) => req.requirementType === 'level')
              .map((req) => ({ traderId: req.trader, name: traderNames.get(req.trader) ?? req.trader, level: req.value })),
          }))
          .sort((a, b) => a.level - b.level),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}
