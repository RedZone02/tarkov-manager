import type { GameMode } from '@/lib/game-mode';
import { getItemCatalog } from './items';
import { memoize } from './source';
import type { CatalogItem, WeaponBuild } from './types';
import { WEAPON_CLASS_ORDER } from './weapon-classes';

export function getWeaponBuilds(mode: GameMode): Promise<WeaponBuild[]> {
  return memoize(`${mode}:builds`, async () => {
    const catalog = await getItemCatalog(mode);
    const defaults = new Map<string, CatalogItem>();
    const named: { preset: CatalogItem; base: CatalogItem }[] = [];

    for (const item of catalog.values()) {
      if (!item.preset) continue;
      const base = catalog.get(item.preset.baseItemId);
      if (!base?.weaponClass) continue;
      if (item.preset.isDefault) defaults.set(base.id, item);
      else named.push({ preset: item, base });
    }

    return named
      .map(({ preset, base }): WeaponBuild => {
        const info = preset.preset!;
        const baseline = defaults.get(base.id)?.preset ?? null;
        const parts = info.parts.map((part) => {
          const item = catalog.get(part.itemId);
          return {
            itemId: part.itemId,
            name: item?.name ?? part.itemId,
            iconLink: item?.iconLink ?? '',
            count: part.count,
            unitPrice: item?.unitPrice ?? null,
          };
        });

        return {
          id: preset.id,
          name: (preset.name.startsWith(base.name) ? preset.name.slice(base.name.length).trim() : '') || preset.name,
          weaponId: base.id,
          weaponName: base.name,
          weaponClass: base.weaponClass!,
          caliber: base.stats?.caliber ?? null,
          iconLink: preset.iconLink || base.iconLink,
          ergonomics: info.ergonomics,
          recoilVertical: info.recoilVertical,
          recoilHorizontal: info.recoilHorizontal,
          moa: info.moa,
          baseline: baseline ? { ergonomics: baseline.ergonomics, recoilVertical: baseline.recoilVertical } : null,
          partsCost: parts.reduce((sum, part) => sum + (part.unitPrice ?? 0) * part.count, 0),
          parts,
        };
      })
      .sort(
        (a, b) =>
          WEAPON_CLASS_ORDER.indexOf(a.weaponClass) - WEAPON_CLASS_ORDER.indexOf(b.weaponClass) ||
          a.weaponName.localeCompare(b.weaponName) ||
          a.name.localeCompare(b.name),
      );
  });
}
