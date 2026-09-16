'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatRoubles } from '@/lib/format';
import type { GameMode } from '@/lib/game-mode';
import { useRaidLog } from '@/lib/storage/hooks';
import type { RaidLogEntry } from '@/lib/storage/types';
import type { ItemSummary } from '@/lib/tarkov/types';
import { randomUuid } from '@/lib/uuid';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { ItemIcon } from '../components/ui/ItemIcon';
import { Select } from '../components/ui/Select';
import { StatTile } from '../components/ui/StatTile';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import ItemSearch from './ItemSearch';

type SectionId = 'gear' | 'consumables' | 'loot';
type PriceSource = 'best' | 'flea' | 'trader';
type Outcome = 'survived' | 'died';

type LineItem = {
  key: string;
  item: ItemSummary | null;
  name: string;
  quantity: number;
  customPrice: number | null;
};

const SECTIONS: { id: SectionId; title: string; hint: string }[] = [
  { id: 'gear', title: 'Gear', hint: 'Weapon, armor, rig and backpack: everything you bring in.' },
  { id: 'consumables', title: 'Consumables', hint: 'Ammo, meds, grenades and food used up during the raid.' },
  { id: 'loot', title: 'Loot', hint: 'Everything you extract with.' },
];

const EMPTY_LINES: Record<SectionId, LineItem[]> = { gear: [], consumables: [], loot: [] };

const inputClass = 'h-9 rounded-lg border border-border bg-surface px-2 text-sm text-text';

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

let lineCounter = 0;
function newKey() {
  lineCounter += 1;
  return `line-${Date.now().toString(36)}-${lineCounter}`;
}

function sellPrice(item: ItemSummary, source: PriceSource): number {
  const flea = item.avg24hPrice ?? item.lastLowPrice ?? 0;
  const trader = item.bestTraderSell?.price ?? 0;
  if (source === 'flea') return flea;
  if (source === 'trader') return trader;
  return Math.max(flea, trader);
}

function linePrice(line: LineItem, section: SectionId, source: PriceSource): number {
  if (line.customPrice !== null) return line.customPrice;
  if (!line.item) return 0;
  return section === 'loot' ? sellPrice(line.item, source) : (line.item.unitPrice ?? 0);
}

export default function RaidCalculatorClient({ mode, mapNames }: { mode: GameMode; mapNames: string[] }) {
  const { entries, addEntry, removeEntry, clear } = useRaidLog(mode);
  const [lines, setLines] = useState(EMPTY_LINES);
  const [priceSource, setPriceSource] = useState<PriceSource>('best');
  const [outcome, setOutcome] = useState<Outcome>('survived');
  const [mapName, setMapName] = useState(mapNames[0] ?? 'Unknown map');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const sectionTotals = useMemo(() => {
    const total = (id: SectionId) => lines[id].reduce((sum, line) => sum + linePrice(line, id, priceSource) * line.quantity, 0);
    return { gear: total('gear'), consumables: total('consumables'), loot: total('loot') };
  }, [lines, priceSource]);

  const investment = sectionTotals.gear + sectionTotals.consumables;
  const survived = outcome === 'survived';
  const extracted = survived ? sectionTotals.loot : 0;
  const spent = survived ? sectionTotals.consumables : investment;
  const profit = extracted - spent;
  const roi = investment > 0 ? profit / investment : null;
  const itemCount = SECTIONS.reduce((sum, s) => sum + lines[s.id].length, 0);

  const history = useMemo(() => {
    const net = entries.reduce((sum, e) => sum + e.totalLoot - e.totalCost, 0);
    const survivedCount = entries.filter((e) => e.survived).length;
    return {
      net,
      average: entries.length ? net / entries.length : 0,
      survivalRate: entries.length ? Math.round((survivedCount / entries.length) * 100) : 0,
    };
  }, [entries]);

  function updateSection(id: SectionId, update: (current: LineItem[]) => LineItem[]) {
    setLines((prev) => ({ ...prev, [id]: update(prev[id]) }));
    setSavedAt(null);
  }

  function saveRaid() {
    const entry: RaidLogEntry = {
      id: randomUuid(),
      createdAt: new Date().toISOString(),
      mapName,
      survived,
      totalCost: spent,
      totalLoot: extracted,
      itemCount,
    };
    addEntry(entry);
    setSavedAt(entry.createdAt);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-col gap-1 text-xs font-medium text-muted">
          Outcome
          <ToggleGroup<Outcome>
            label="Raid outcome"
            value={outcome}
            onChange={setOutcome}
            options={[
              { value: 'survived', label: 'Survived' },
              { value: 'died', label: 'Died' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1 text-xs font-medium text-muted">
          Loot price
          <ToggleGroup<PriceSource>
            label="Loot price source"
            value={priceSource}
            onChange={setPriceSource}
            options={[
              { value: 'best', label: 'Best' },
              { value: 'flea', label: 'Flea 24h avg' },
              { value: 'trader', label: 'Best trader' },
            ]}
          />
        </div>
        <Button variant="ghost" className="lg:ml-auto" onClick={() => updateSection('gear', () => []) }>
          Clear gear
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setLines(EMPTY_LINES);
            setSavedAt(null);
          }}
        >
          Clear all
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Investment" value={formatRoubles(investment)} hint="Gear + consumables" />
        <StatTile label="Extracted value" value={formatRoubles(extracted)} hint={survived ? 'Loot you brought out' : 'Loot is lost on death'} />
        <StatTile
          label={profit >= 0 ? 'Profit' : 'Loss'}
          value={formatRoubles(profit)}
          tone={profit >= 0 ? 'success' : 'accent'}
          hint={survived ? 'Loot minus consumables used' : 'Everything you brought is lost'}
        />
        <StatTile label="Return on investment" value={roi === null ? '—' : `${Math.round(roi * 100)}%`} tone={roi !== null && roi < 0 ? 'accent' : 'default'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{section.title}</CardTitle>
                <p className="text-xs text-muted">{section.hint}</p>
              </div>
              <span className="font-semibold tabular-nums">{formatRoubles(sectionTotals[section.id])}</span>
            </div>

            <ItemSearch
              mode={mode}
              label={`Add ${section.title.toLowerCase()} item`}
              priceLabel={section.id === 'loot' ? (item) => sellPrice(item, priceSource) : (item) => item.unitPrice}
              onSelect={(item) =>
                updateSection(section.id, (current) => [
                  ...current,
                  { key: newKey(), item, name: item.name, quantity: 1, customPrice: null },
                ])
              }
            />
            <Button
              size="sm"
              variant="ghost"
              className="self-start"
              onClick={() =>
                updateSection(section.id, (current) => [
                  ...current,
                  { key: newKey(), item: null, name: '', quantity: 1, customPrice: 0 },
                ])
              }
            >
              + Custom line
            </Button>

            {lines[section.id].length === 0 ? (
              <p className="text-sm text-muted">Nothing added yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {lines[section.id].map((line) => {
                  const price = linePrice(line, section.id, priceSource);
                  const update = (patch: Partial<LineItem>) =>
                    updateSection(section.id, (current) => current.map((l) => (l.key === line.key ? { ...l, ...patch } : l)));
                  return (
                    <li key={line.key} className="flex flex-col gap-2 py-2">
                      <div className="flex items-center gap-2">
                        {line.item && <ItemIcon src={line.item.iconLink} size={28} />}
                        {line.item ? (
                          <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>
                        ) : (
                          <input
                            aria-label="Custom item name"
                            placeholder="Item name"
                            value={line.name}
                            onChange={(e) => update({ name: e.target.value })}
                            className={cn(inputClass, 'min-w-0 flex-1')}
                          />
                        )}
                        <button
                          type="button"
                          aria-label={`Remove ${line.name || 'custom line'}`}
                          onClick={() => updateSection(section.id, (current) => current.filter((l) => l.key !== line.key))}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-accent"
                        >
                          <span aria-hidden>×</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <label className="flex items-center gap-1">
                          Qty
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => update({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className={cn(inputClass, 'w-16')}
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          ₽ each
                          <input
                            type="number"
                            min={0}
                            value={Math.round(price)}
                            onChange={(e) => update({ customPrice: Math.max(0, Number(e.target.value) || 0) })}
                            className={cn(inputClass, 'w-28')}
                          />
                        </label>
                        {line.item && line.customPrice !== null && (
                          <button type="button" onClick={() => update({ customPrice: null })} className="underline hover:text-text">
                            Use live price
                          </button>
                        )}
                        <span className="ml-auto text-sm font-medium tabular-nums text-text">{formatRoubles(price * line.quantity)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Select label="Map" value={mapName} onChange={(e) => setMapName(e.target.value)} className="sm:w-56">
          {(mapNames.length ? mapNames : ['Unknown map']).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Button variant="primary" onClick={saveRaid} disabled={itemCount === 0}>
          Save raid to log
        </Button>
        <p className="text-sm text-muted" aria-live="polite">
          {savedAt ? `Saved: ${survived ? 'survived' : 'died'} on ${mapName}, ${formatRoubles(profit)}.` : 'Saving adds this raid to your history below.'}
        </p>
      </Card>

      <section aria-labelledby="raid-history" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="raid-history" className="text-xl font-semibold">
            Raid history
          </h2>
          {entries.length > 0 &&
            (confirmingClear ? (
              <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
                Delete all {entries.length} saved raids?
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    clear();
                    setConfirmingClear(false);
                  }}
                >
                  Delete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmingClear(false)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setConfirmingClear(true)}>
                Clear history
              </Button>
            ))}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted">No raids saved yet.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Raids logged" value={entries.length} />
              <StatTile label="Survival rate" value={`${history.survivalRate}%`} />
              <StatTile label="Net result" value={formatRoubles(history.net)} tone={history.net >= 0 ? 'success' : 'accent'} />
              <StatTile label="Average per raid" value={formatRoubles(history.average)} />
            </div>
            <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
              {entries.map((entry) => {
                const result = entry.totalLoot - entry.totalCost;
                return (
                  <li key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-40 text-muted">{dateFormat.format(new Date(entry.createdAt))}</span>
                    <span className="min-w-0 flex-1 font-medium">{entry.mapName}</span>
                    <Badge tone={entry.survived ? 'success' : 'accent'}>{entry.survived ? 'Survived' : 'Died'}</Badge>
                    <span className={cn('w-28 text-right font-semibold tabular-nums', result >= 0 ? 'text-success' : 'text-accent')}>
                      {formatRoubles(result)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete raid on ${entry.mapName}`}
                      onClick={() => removeEntry(entry.id)}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-accent"
                    >
                      <span aria-hidden>×</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
