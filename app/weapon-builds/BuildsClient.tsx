'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatRoubles } from '@/lib/format';
import { caliberLabel } from '@/lib/tarkov/calibers';
import type { WeaponBuild } from '@/lib/tarkov/types';
import { WEAPON_CLASS_LABELS, WEAPON_CLASS_ORDER } from '@/lib/tarkov/weapon-classes';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemIcon } from '../components/ui/ItemIcon';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { ToggleGroup } from '../components/ui/ToggleGroup';

type SortKey = 'recoil' | 'ergonomics' | 'cost' | 'name';

const PAGE_SIZE = 24;

function sortValue(build: WeaponBuild, key: Exclude<SortKey, 'name'>): number | null {
  if (key === 'recoil') return build.recoilVertical;
  if (key === 'ergonomics') return build.ergonomics;
  return build.partsCost;
}

export default function BuildsClient({ builds }: { builds: WeaponBuild[] }) {
  const [weaponClass, setWeaponClass] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recoil');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const classOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const build of builds) counts.set(build.weaponClass, (counts.get(build.weaponClass) ?? 0) + 1);
    return [
      { value: 'all', label: 'All', count: builds.length },
      ...WEAPON_CLASS_ORDER.filter((c) => counts.has(c)).map((c) => ({ value: c, label: WEAPON_CLASS_LABELS[c], count: counts.get(c)! })),
    ];
  }, [builds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return builds
      .filter(
        (build) =>
          (weaponClass === 'all' || build.weaponClass === weaponClass) &&
          (!q || build.weaponName.toLowerCase().includes(q) || build.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        if (sort === 'name') return a.weaponName.localeCompare(b.weaponName) || a.name.localeCompare(b.name);
        const av = sortValue(a, sort);
        const bv = sortValue(b, sort);
        if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
        return sort === 'ergonomics' ? bv - av : av - bv;
      });
  }, [builds, weaponClass, query, sort]);

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        label="Weapon class"
        value={weaponClass}
        onChange={(value) => {
          setWeaponClass(value);
          setVisibleCount(PAGE_SIZE);
        }}
        options={classOptions}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search weapons or builds"
          aria-label="Search weapons or builds"
          className="sm:w-80"
        />
        <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-52">
          <option value="recoil">Lowest vertical recoil</option>
          <option value="ergonomics">Highest ergonomics</option>
          <option value="cost">Cheapest parts</option>
          <option value="name">Weapon name</option>
        </Select>
        <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
          {filtered.length} builds
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔧" title="No builds match your filters" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, visibleCount).map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <Button className="self-center" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              Show more builds
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function BuildCard({ build }: { build: WeaponBuild }) {
  const unpriced = build.parts.filter((part) => part.unitPrice === null).length;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <ItemIcon src={build.iconLink} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">
            {WEAPON_CLASS_LABELS[build.weaponClass] ?? build.weaponClass}
            {build.caliber ? ` · ${caliberLabel(build.caliber)}` : ''}
          </p>
          <h3 className="font-semibold leading-snug">{build.weaponName}</h3>
          <Badge tone="accent" className="mt-1">
            {build.name}
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <StatCell label="Ergonomics" value={build.ergonomics} baseline={build.baseline?.ergonomics ?? null} higherIsBetter />
        <StatCell label="Vertical recoil" value={build.recoilVertical} baseline={build.baseline?.recoilVertical ?? null} />
        <div className="rounded-lg bg-surface-2 p-2">
          <dt className="text-[0.7rem] text-muted">MOA</dt>
          <dd className="font-semibold tabular-nums">{build.moa === null ? '—' : build.moa.toFixed(2)}</dd>
        </div>
      </dl>

      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted">Parts cost</span>
        <span className="font-semibold tabular-nums">
          {formatRoubles(build.partsCost)}
          {unpriced > 0 && <span className="ml-1 text-xs font-normal text-muted">(+{unpriced} unpriced)</span>}
        </span>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted hover:text-text">{build.parts.length} parts</summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {build.parts.map((part, index) => (
            <li key={`${part.itemId}-${index}`} className="flex items-center gap-2">
              <ItemIcon src={part.iconLink} size={28} />
              <span className="min-w-0 flex-1 truncate">{part.name}</span>
              {part.count > 1 && <span className="text-muted">×{part.count}</span>}
              <span className="tabular-nums text-muted">
                {formatRoubles(part.unitPrice === null ? null : part.unitPrice * part.count)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

type StatCellProps = {
  label: string;
  value: number | null;
  baseline: number | null;
  higherIsBetter?: boolean;
};

function StatCell({ label, value, baseline, higherIsBetter = false }: StatCellProps) {
  const delta = value !== null && baseline !== null ? Math.round(value - baseline) : 0;
  const better = higherIsBetter ? delta > 0 : delta < 0;

  return (
    <div className="rounded-lg bg-surface-2 p-2">
      <dt className="text-[0.7rem] text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value === null ? '—' : Math.round(value)}</dd>
      {delta !== 0 && (
        <dd className={cn('text-xs tabular-nums', better ? 'text-success' : 'text-accent')}>
          {delta > 0 ? '+' : ''}
          {delta} vs stock
        </dd>
      )}
    </div>
  );
}
