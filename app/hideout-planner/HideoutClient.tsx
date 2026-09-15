'use client';

import { useMemo, useState } from 'react';
import { formatDuration, formatNumber, formatRoubles } from '@/lib/format';
import type { GameMode } from '@/lib/game-mode';
import { useHideoutProgress } from '@/lib/storage/hooks';
import type { HideoutItemRequirement, HideoutLevel, HideoutStation } from '@/lib/tarkov/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemIcon } from '../components/ui/ItemIcon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatTile } from '../components/ui/StatTile';
import { ToggleGroup } from '../components/ui/ToggleGroup';

type View = 'stations' | 'shopping';
type ShoppingScope = 'next' | 'all';

type StationPlan = {
  station: HideoutStation;
  current: number;
  maxLevel: number;
  next: HideoutLevel | null;
  missingStations: HideoutLevel['stations'];
  ready: boolean;
  cost: number;
};

type ShoppingEntry = { item: HideoutItemRequirement; count: number; foundInRaid: number };

function levelCost(level: HideoutLevel): number {
  return level.items.reduce((sum, req) => sum + req.count * (req.unitPrice ?? 0), 0);
}

export default function HideoutClient({ mode, stations }: { mode: GameMode; stations: HideoutStation[] }) {
  const { levels, setLevel, reset } = useHideoutProgress(mode);
  const [view, setView] = useState<View>('stations');
  const [scope, setScope] = useState<ShoppingScope>('next');
  const [confirmingReset, setConfirmingReset] = useState(false);

  const plans = useMemo<StationPlan[]>(
    () =>
      stations.map((station) => {
        const maxLevel = Math.max(0, ...station.levels.map((l) => l.level));
        const current = Math.min(levels[station.id] ?? 0, maxLevel);
        const next = station.levels.find((l) => l.level === current + 1) ?? null;
        const missingStations = next ? next.stations.filter((req) => (levels[req.stationId] ?? 0) < req.level) : [];
        return {
          station,
          current,
          maxLevel,
          next,
          missingStations,
          ready: next !== null && missingStations.length === 0,
          cost: next ? levelCost(next) : 0,
        };
      }),
    [stations, levels],
  );

  const ready = plans.filter((p) => p.ready).sort((a, b) => a.cost - b.cost);
  const maxed = plans.filter((p) => p.next === null).length;
  const remainingUpgrades = plans.reduce((sum, p) => sum + (p.maxLevel - p.current), 0);

  const shopping = useMemo(() => {
    const totals = new Map<string, ShoppingEntry>();
    for (const { station, current, next } of plans) {
      const toBuild = scope === 'next' ? (next ? [next] : []) : station.levels.filter((l) => l.level > current);
      for (const level of toBuild) {
        for (const req of level.items) {
          const entry = totals.get(req.itemId) ?? { item: req, count: 0, foundInRaid: 0 };
          totals.set(req.itemId, {
            item: entry.item,
            count: entry.count + req.count,
            foundInRaid: entry.foundInRaid + (req.foundInRaid ? req.count : 0),
          });
        }
      }
    }
    return [...totals.values()].sort((a, b) => b.count * (b.item.unitPrice ?? 0) - a.count * (a.item.unitPrice ?? 0));
  }, [plans, scope]);

  const shoppingTotal = shopping.reduce((sum, e) => sum + e.count * (e.item.unitPrice ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Ready to build" value={ready.length} tone="success" hint="Station requirements met" />
        <StatTile label="Upgrades left" value={remainingUpgrades} />
        <StatTile label="Stations maxed" value={`${maxed}/${plans.length}`} />
        <StatTile
          label="Cost of ready upgrades"
          value={formatRoubles(ready.reduce((sum, p) => sum + p.cost, 0))}
          tone="warning"
          hint="Estimated from flea and trader prices"
        />
      </div>

      <section aria-labelledby="hideout-ready" className="rounded-xl border border-border bg-surface p-5">
        <h2 id="hideout-ready" className="text-lg font-semibold">
          🔔 Ready to build
        </h2>
        {ready.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No upgrades are unlocked yet. Set your current station levels below.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {ready.map((plan) => (
              <li key={plan.station.id} className="flex flex-wrap items-center gap-3 py-2">
                <ItemIcon src={plan.station.imageLink} size={32} />
                <span className="min-w-0 flex-1 font-medium">
                  {plan.station.name} <span className="text-muted">→ level {plan.next!.level}</span>
                </span>
                <span className="text-sm text-muted">
                  {plan.next!.items.length} items · {formatRoubles(plan.cost)}
                </span>
                <Button size="sm" onClick={() => setLevel(plan.station.id, plan.next!.level)}>
                  Mark built
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup<View>
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'stations', label: 'Stations' },
            { value: 'shopping', label: 'Shopping list', count: shopping.length },
          ]}
        />
        {view === 'shopping' && (
          <ToggleGroup<ShoppingScope>
            label="Shopping list scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'next', label: 'Next upgrades' },
              { value: 'all', label: 'Everything left' },
            ]}
          />
        )}
        <div className="ml-auto">
          {confirmingReset ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              Reset all station levels?
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  reset();
                  setConfirmingReset(false);
                }}
              >
                Reset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmingReset(true)}>
              Reset levels
            </Button>
          )}
        </div>
      </div>

      {view === 'stations' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <StationCard key={plan.station.id} plan={plan} onSetLevel={setLevel} />
          ))}
        </div>
      ) : shopping.length === 0 ? (
        <EmptyState icon="🏠" title="Nothing left to buy">
          Every station in this scope is fully upgraded.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Item</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Needed</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Found in raid</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Unit price</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {shopping.map((entry) => (
                <tr key={entry.item.itemId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <ItemIcon src={entry.item.iconLink} size={28} />
                      {entry.item.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(entry.count)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{entry.foundInRaid > 0 ? formatNumber(entry.foundInRaid) : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRoubles(entry.item.unitPrice)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {entry.item.unitPrice === null ? '—' : formatRoubles(entry.count * entry.item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border">
              <tr>
                <th scope="row" colSpan={4} className="px-3 py-2 text-right font-medium">
                  Estimated total
                </th>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatRoubles(shoppingTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function StationCard({ plan, onSetLevel }: { plan: StationPlan; onSetLevel: (stationId: string, level: number) => void }) {
  const { station, current, maxLevel, next, missingStations, ready } = plan;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <ItemIcon src={station.imageLink} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{station.name}</h3>
          <p className="text-xs text-muted">
            Level {current} of {maxLevel}
          </p>
        </div>
        <select
          aria-label={`${station.name} built level`}
          value={current}
          onChange={(e) => onSetLevel(station.id, Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text"
        >
          {Array.from({ length: maxLevel + 1 }, (_, level) => (
            <option key={level} value={level}>
              {level === 0 ? 'Not built' : `Level ${level}`}
            </option>
          ))}
        </select>
      </div>
      <ProgressBar value={current} max={maxLevel} showValue={false} label={`${station.name} upgrade progress`} />

      {next ? (
        <div className="flex flex-1 flex-col gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Next: level {next.level}</span>
            <Badge tone={ready ? 'success' : 'neutral'}>{ready ? 'Ready to build' : 'Blocked'}</Badge>
            {next.constructionTime > 0 && (
              <span className="text-xs text-muted">Build time {formatDuration(next.constructionTime)}</span>
            )}
          </div>

          {(next.stations.length > 0 || next.traders.length > 0) && (
            <ul className="flex flex-wrap gap-1.5">
              {next.stations.map((req) => {
                const met = !missingStations.includes(req);
                return (
                  <li key={req.stationId}>
                    <Badge tone={met ? 'success' : 'warning'}>
                      <span aria-hidden>{met ? '✓' : '✗'}</span>
                      {req.name} {req.level}
                      <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
                    </Badge>
                  </li>
                );
              })}
              {next.traders.map((req) => (
                <li key={req.traderId}>
                  <Badge tone="info">
                    {req.name} LL{req.level}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {next.items.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {next.items.map((req) => (
                <li key={req.itemId} className="flex items-center gap-2">
                  <ItemIcon src={req.iconLink} size={28} />
                  <span className="min-w-0 flex-1 truncate">{req.name}</span>
                  {req.foundInRaid && (
                    <Badge tone="warning" title="Must be found in raid">
                      FIR
                    </Badge>
                  )}
                  <span className="tabular-nums text-muted">×{formatNumber(req.count)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="text-xs text-muted">
              Est. cost <span className="font-medium text-text">{formatRoubles(plan.cost)}</span>
            </span>
            <Button size="sm" variant={ready ? 'primary' : 'secondary'} onClick={() => onSetLevel(station.id, next.level)}>
              Mark level {next.level} built
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-success">Fully upgraded</p>
      )}
    </article>
  );
}
