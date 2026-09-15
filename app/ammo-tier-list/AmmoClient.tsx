'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatNumber, formatPercent, formatRoubles } from '@/lib/format';
import { caliberLabel } from '@/lib/tarkov/calibers';
import type { AmmoRound } from '@/lib/tarkov/types';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemIcon } from '../components/ui/ItemIcon';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';

type SortKey = 'name' | 'penetrationPower' | 'damage' | 'armorDamage' | 'fragmentationChance' | 'initialSpeed' | 'unitPrice';
type Sort = { key: SortKey; dir: 'asc' | 'desc' };

const TIERS: { tier: string; min: number; tone: BadgeTone }[] = [
  { tier: 'S', min: 60, tone: 'success' },
  { tier: 'A', min: 50, tone: 'success' },
  { tier: 'B', min: 40, tone: 'info' },
  { tier: 'C', min: 30, tone: 'neutral' },
  { tier: 'D', min: 20, tone: 'warning' },
  { tier: 'F', min: 0, tone: 'accent' },
];

function tierFor(penetration: number) {
  return TIERS.find((t) => penetration >= t.min) ?? TIERS[TIERS.length - 1];
}

const ARMOR_CLASSES = [1, 2, 3, 4, 5, 6];

type ArmorRating = 'good' | 'fair' | 'poor';

function armorRating(penetration: number, armorClass: number): ArmorRating {
  const threshold = armorClass * 10;
  if (penetration >= threshold + 10) return 'good';
  if (penetration >= threshold) return 'fair';
  return 'poor';
}

const ratingClasses: Record<ArmorRating, string> = {
  good: 'bg-success/20 text-success',
  fair: 'bg-warning/20 text-warning',
  poor: 'bg-surface-2 text-muted',
};

const columns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Round', align: 'left' },
  { key: 'penetrationPower', label: 'Pen', align: 'right' },
  { key: 'damage', label: 'Damage', align: 'right' },
  { key: 'armorDamage', label: 'Armor dmg', align: 'right' },
  { key: 'fragmentationChance', label: 'Frag', align: 'right' },
  { key: 'initialSpeed', label: 'Speed', align: 'right' },
  { key: 'unitPrice', label: 'Price', align: 'right' },
];

function sortRounds(rounds: AmmoRound[], sort: Sort): AmmoRound[] {
  return [...rounds].sort((a, b) => {
    if (sort.key === 'name') {
      const diff = a.name.localeCompare(b.name);
      return sort.dir === 'asc' ? diff : -diff;
    }
    const av = a[sort.key];
    const bv = b[sort.key];
    if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    return sort.dir === 'asc' ? av - bv : bv - av;
  });
}

export default function AmmoClient({ ammo }: { ammo: AmmoRound[] }) {
  const [query, setQuery] = useState('');
  const [caliber, setCaliber] = useState('all');
  const [sort, setSort] = useState<Sort>({ key: 'penetrationPower', dir: 'desc' });

  const caliberOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const round of ammo) counts.set(round.caliber, (counts.get(round.caliber) ?? 0) + 1);
    return [...counts]
      .map(([value, count]) => ({ value, label: caliberLabel(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ammo]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = ammo.filter(
      (round) =>
        (caliber === 'all' || round.caliber === caliber) &&
        (!q || round.name.toLowerCase().includes(q) || round.shortName.toLowerCase().includes(q)),
    );
    return sortRounds(filtered, sort);
  }, [ammo, query, caliber, sort]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search rounds, e.g. M855A1"
          aria-label="Search rounds"
          className="sm:w-80"
        />
        <Select label="Caliber" value={caliber} onChange={(e) => setCaliber(e.target.value)} className="sm:w-64">
          <option value="all">All calibers ({ammo.length})</option>
          {caliberOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.count})
            </option>
          ))}
        </Select>
        <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
          {rows.length} rounds
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
        <span className="flex flex-wrap items-center gap-1.5">
          Tier by penetration:
          {TIERS.map((t) => (
            <Badge key={t.tier} tone={t.tone}>
              {t.tier} {t.min > 0 ? `≥${t.min}` : `<${TIERS[TIERS.length - 2].min}`}
            </Badge>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          Armor class estimate:
          <span className={cn('rounded px-1.5 py-0.5', ratingClasses.good)}>good</span>
          <span className={cn('rounded px-1.5 py-0.5', ratingClasses.fair)}>fair</span>
          <span className={cn('rounded px-1.5 py-0.5', ratingClasses.poor)}>poor</span>
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No rounds match your filters">Try another caliber or clear the search.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[62rem] text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                {columns.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn('px-3 py-2 font-medium', col.align === 'right' ? 'text-right' : 'text-left')}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn('inline-flex items-center gap-1 rounded hover:text-text', active && 'text-text')}
                      >
                        {col.label}
                        <span aria-hidden className="text-[0.65rem]">
                          {active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  vs armor class
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((round) => {
                const tier = tierFor(round.penetrationPower);
                return (
                  <tr key={round.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <ItemIcon src={round.iconLink} size={32} />
                        <div className="min-w-0">
                          <p className="font-medium">{round.name}</p>
                          <p className="text-xs text-muted">{caliberLabel(round.caliber)}</p>
                        </div>
                        <Badge tone={tier.tone} className="ml-auto">
                          <span className="sr-only">Tier </span>
                          {tier.tier}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{round.penetrationPower}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {round.projectileCount > 1 ? `${round.damage}×${round.projectileCount}` : round.damage}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{round.armorDamage}%</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPercent(round.fragmentationChance)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatNumber(round.initialSpeed)} m/s</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatRoubles(round.unitPrice)}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {ARMOR_CLASSES.map((armorClass) => {
                          const rating = armorRating(round.penetrationPower, armorClass);
                          return (
                            <span
                              key={armorClass}
                              title={`Class ${armorClass}: ${rating}`}
                              className={cn(
                                'inline-flex size-6 items-center justify-center rounded text-xs font-semibold',
                                ratingClasses[rating],
                              )}
                            >
                              {armorClass}
                              <span className="sr-only">: {rating}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
