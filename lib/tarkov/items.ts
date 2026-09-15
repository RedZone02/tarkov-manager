import type { GameMode } from '@/lib/game-mode';
import { loadRaw, memoize, translate, type Locale } from './source';
import type { AmmoStats, CatalogItem, ItemSummary, PresetInfo, WeaponStats } from './types';
import { WEAPON_CLASS_LABELS } from './weapon-classes';

export const ROUBLES_ID = '5449016a4bdc2d6f028b456f';

type RawTraderOffer = { trader: string; priceRUB: number; minTraderLevel?: number };

type RawItem = {
  id: string;
  name: string;
  shortName: string;
  iconLink: string | null;
  types: string[];
  categories: string[];
  basePrice: number;
  avg24hPrice: number | null;
  lastLowPrice: number | null;
  sellToTrader: RawTraderOffer[] | null;
  buyFromTrader: RawTraderOffer[] | null;
  containsItems: { item: string; count: number }[] | null;
  properties: Record<string, unknown> | null;
};

type RawCategory = { id: string; normalizedName: string };

type RawItemsFile = {
  items: Record<string, RawItem>;
  itemCategories: Record<string, RawCategory> | RawCategory[];
};

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toAmmoStats(props: Record<string, unknown>): AmmoStats {
  return {
    caliber: typeof props.caliber === 'string' ? props.caliber : '',
    damage: num(props.damage) ?? 0,
    penetrationPower: num(props.penetrationPower) ?? 0,
    armorDamage: num(props.armorDamage) ?? 0,
    fragmentationChance: num(props.fragmentationChance) ?? 0,
    initialSpeed: num(props.initialSpeed) ?? 0,
    projectileCount: num(props.projectileCount) ?? 1,
    tracer: props.tracer === true,
  };
}

function toWeaponStats(props: Record<string, unknown>): WeaponStats | null {
  const stats: WeaponStats = {
    ergonomics: num(props.ergonomics),
    recoilVertical: num(props.recoilVertical),
    recoilHorizontal: num(props.recoilHorizontal),
    recoilModifier: num(props.recoilModifier),
    caliber: typeof props.caliber === 'string' ? props.caliber : null,
  };
  return stats.ergonomics === null && stats.recoilModifier === null && stats.recoilVertical === null ? null : stats;
}

function toPresetInfo(props: Record<string, unknown>, raw: RawItem): PresetInfo {
  return {
    baseItemId: typeof props.baseItem === 'string' ? props.baseItem : '',
    isDefault: props.default === true,
    ergonomics: num(props.ergonomics),
    recoilVertical: num(props.recoilVertical),
    recoilHorizontal: num(props.recoilHorizontal),
    moa: num(props.moa),
    parts: (raw.containsItems ?? []).map((part) => ({ itemId: part.item, count: part.count })),
  };
}

function toCatalogItem(raw: RawItem, locale: Locale, categoryNames: Map<string, string>): CatalogItem {
  const bestSell = (raw.sellToTrader ?? []).reduce<RawTraderOffer | null>(
    (best, offer) => (!best || offer.priceRUB > best.priceRUB ? offer : best),
    null,
  );
  const cheapestBuy = (raw.buyFromTrader ?? []).reduce<RawTraderOffer | null>(
    (best, offer) => (!best || offer.priceRUB < best.priceRUB ? offer : best),
    null,
  );
  const flea = raw.avg24hPrice || raw.lastLowPrice || null;
  const acquirePrices = [flea, cheapestBuy?.priceRUB].filter((p): p is number => typeof p === 'number' && p > 0);
  const props = raw.properties;

  return {
    id: raw.id,
    name: translate(locale, raw.name),
    shortName: translate(locale, raw.shortName),
    iconLink: raw.iconLink ?? '',
    types: raw.types,
    basePrice: raw.basePrice,
    avg24hPrice: raw.avg24hPrice || null,
    lastLowPrice: raw.lastLowPrice || null,
    bestTraderSell: bestSell ? { traderId: bestSell.trader, price: bestSell.priceRUB } : null,
    cheapestTraderBuy: cheapestBuy
      ? { traderId: cheapestBuy.trader, price: cheapestBuy.priceRUB, minTraderLevel: cheapestBuy.minTraderLevel ?? 1 }
      : null,
    unitPrice: raw.id === ROUBLES_ID ? 1 : acquirePrices.length ? Math.min(...acquirePrices) : null,
    ammo: props?.propertiesType === 'ItemPropertiesAmmo' ? toAmmoStats(props) : null,
    stats: props ? toWeaponStats(props) : null,
    preset: props?.propertiesType === 'ItemPropertiesPreset' ? toPresetInfo(props, raw) : null,
    weaponClass: raw.types.includes('gun')
      ? (raw.categories
          .map((id) => categoryNames.get(id))
          .find((name): name is string => name !== undefined && name in WEAPON_CLASS_LABELS) ?? null)
      : null,
  };
}

export function toItemSummary(item: CatalogItem): ItemSummary {
  return {
    id: item.id,
    name: item.name,
    shortName: item.shortName,
    iconLink: item.iconLink,
    types: item.types,
    basePrice: item.basePrice,
    avg24hPrice: item.avg24hPrice,
    lastLowPrice: item.lastLowPrice,
    bestTraderSell: item.bestTraderSell,
    cheapestTraderBuy: item.cheapestTraderBuy,
    unitPrice: item.unitPrice,
  };
}

export function getItemCatalog(mode: GameMode): Promise<Map<string, CatalogItem>> {
  return memoize(`${mode}:items`, async () => {
    const { data, locale } = await loadRaw<RawItemsFile>(mode, 'items');
    const categories = Array.isArray(data.itemCategories) ? data.itemCategories : Object.values(data.itemCategories);
    const categoryNames = new Map(categories.map((category) => [category.id, category.normalizedName]));

    const catalog = new Map<string, CatalogItem>();
    for (const raw of Object.values(data.items)) catalog.set(raw.id, toCatalogItem(raw, locale, categoryNames));
    return catalog;
  });
}

export async function searchItems(mode: GameMode, query: string, limit = 20): Promise<ItemSummary[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const catalog = await getItemCatalog(mode);
  const matches: { item: CatalogItem; score: number }[] = [];
  for (const item of catalog.values()) {
    const shortName = item.shortName.toLowerCase();
    const name = item.name.toLowerCase();
    const score =
      shortName === q ? 4 : shortName.startsWith(q) || name.startsWith(q) ? 3 : name.includes(q) ? 2 : shortName.includes(q) ? 1 : 0;
    if (score > 0) matches.push({ item, score });
  }

  return matches
    .sort((a, b) => b.score - a.score || a.item.name.length - b.item.name.length)
    .slice(0, limit)
    .map(({ item }) => toItemSummary(item));
}
