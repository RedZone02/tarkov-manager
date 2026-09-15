'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { GameMode } from '@/lib/game-mode';
import { collectChain, getTaskStatus, isForFaction, type TaskStatus } from '@/lib/quests';
import { useQuestProgress } from '@/lib/storage/hooks';
import type { Faction } from '@/lib/storage/types';
import type { Task, Trader } from '@/lib/tarkov/types';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemIcon } from '../components/ui/ItemIcon';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { StatTile } from '../components/ui/StatTile';
import { ToggleGroup } from '../components/ui/ToggleGroup';
import TaskCard from './TaskCard';

type StatusFilter = TaskStatus | 'all';

const PAGE_SIZE = 50;
const MAX_PLAYER_LEVEL = 79;

type QuestClientProps = {
  mode: GameMode;
  tasks: Task[];
  traders: Trader[];
  mapNames: Record<string, string>;
};

export default function QuestClient({ mode, tasks, traders, mapNames }: QuestClientProps) {
  const { progress, completed, setCompleted, setPlayerLevel, setFaction, reset } = useQuestProgress(mode);
  const [traderId, setTraderId] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('available');
  const [mapId, setMapId] = useState('all');
  const [query, setQuery] = useState('');
  const [kappaOnly, setKappaOnly] = useState(false);
  const [lightkeeperOnly, setLightkeeperOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const tradersById = useMemo(() => new Map(traders.map((t) => [t.id, t])), [traders]);
  const factionTasks = useMemo(() => tasks.filter((t) => isForFaction(t, progress.faction)), [tasks, progress.faction]);
  const statuses = useMemo(
    () => new Map(factionTasks.map((t) => [t.id, getTaskStatus(t, completed, progress.playerLevel)])),
    [factionTasks, completed, progress.playerLevel],
  );

  const traderStats = useMemo(
    () =>
      traders
        .map((trader) => {
          const own = factionTasks.filter((t) => t.traderId === trader.id);
          return { trader, total: own.length, done: own.filter((t) => completed.has(t.id)).length };
        })
        .filter((s) => s.total > 0),
    [traders, factionTasks, completed],
  );

  const mapOptions = useMemo(() => {
    const ids = new Set<string>();
    for (const task of factionTasks) {
      if (task.mapId) ids.add(task.mapId);
      for (const objective of task.objectives) objective.mapIds.forEach((id) => ids.add(id));
    }
    return [...ids]
      .filter((id) => mapNames[id])
      .map((id) => ({ id, name: mapNames[id] }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [factionTasks, mapNames]);

  const summary = useMemo(() => {
    const count = (list: Task[]) => ({ done: list.filter((t) => completed.has(t.id)).length, total: list.length });
    return {
      all: count(factionTasks),
      available: factionTasks.filter((t) => statuses.get(t.id) === 'available').length,
      kappa: count(factionTasks.filter((t) => t.kappaRequired)),
      lightkeeper: count(factionTasks.filter((t) => t.lightkeeperRequired)),
    };
  }, [factionTasks, statuses, completed]);

  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return factionTasks.filter(
      (t) =>
        (traderId === 'all' || t.traderId === traderId) &&
        (mapId === 'all' || t.mapId === mapId || t.objectives.some((o) => o.mapIds.includes(mapId))) &&
        (!kappaOnly || t.kappaRequired) &&
        (!lightkeeperOnly || t.lightkeeperRequired) &&
        (!q || t.name.toLowerCase().includes(q)),
    );
  }, [factionTasks, traderId, mapId, kappaOnly, lightkeeperOnly, query]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: baseFiltered.length, available: 0, locked: 0, completed: 0 };
    for (const task of baseFiltered) counts[statuses.get(task.id) ?? 'locked'] += 1;
    return counts;
  }, [baseFiltered, statuses]);

  const filtered = useMemo(
    () =>
      baseFiltered
        .filter((t) => status === 'all' || statuses.get(t.id) === status)
        .sort((a, b) => a.minPlayerLevel - b.minPlayerLevel || a.name.localeCompare(b.name)),
    [baseFiltered, status, statuses],
  );

  const unfinishedPrerequisites = useCallback(
    (taskId: string) =>
      collectChain([taskId], tasksById)
        .filter((t) => t.id !== taskId && !completed.has(t.id) && isForFaction(t, progress.faction))
        .map((t) => t.id),
    [tasksById, completed, progress.faction],
  );

  function filterSetter<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setVisibleCount(PAGE_SIZE);
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Quests completed" value={`${summary.all.done}/${summary.all.total}`} />
        <StatTile label="Available now" value={summary.available} tone="success" hint={`At level ${progress.playerLevel}`} />
        <StatTile label="Kappa quests" value={`${summary.kappa.done}/${summary.kappa.total}`} tone="warning" />
        <StatTile label="Lightkeeper quests" value={`${summary.lightkeeper.done}/${summary.lightkeeper.total}`} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Player level
          <input
            type="number"
            min={1}
            max={MAX_PLAYER_LEVEL}
            value={progress.playerLevel}
            onChange={(e) => setPlayerLevel(Math.min(MAX_PLAYER_LEVEL, Math.max(1, Number(e.target.value) || 1)))}
            className="h-10 w-28 rounded-lg border border-border bg-surface px-3 text-sm text-text"
          />
        </label>
        <div className="flex flex-col gap-1 text-xs font-medium text-muted">
          Faction
          <ToggleGroup<Faction>
            label="Faction"
            value={progress.faction}
            onChange={setFaction}
            options={[
              { value: 'USEC', label: 'USEC' },
              { value: 'BEAR', label: 'BEAR' },
            ]}
          />
        </div>
        <div className="sm:ml-auto">
          {confirmingReset ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Clear all quest progress for this mode?</span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  reset();
                  setConfirmingReset(false);
                }}
              >
                Clear progress
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmingReset(true)}>
              Reset progress
            </Button>
          )}
        </div>
      </div>

      <div role="group" aria-label="Trader" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <TraderButton
          label="All traders"
          active={traderId === 'all'}
          done={summary.all.done}
          total={summary.all.total}
          onClick={() => filterSetter(setTraderId)('all')}
        />
        {traderStats.map(({ trader, done, total }) => (
          <TraderButton
            key={trader.id}
            label={trader.name}
            imageLink={trader.imageLink}
            active={traderId === trader.id}
            done={done}
            total={total}
            onClick={() => filterSetter(setTraderId)(trader.id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <SearchInput
          value={query}
          onChange={(e) => filterSetter(setQuery)(e.target.value)}
          placeholder="Search quests"
          aria-label="Search quests"
          className="lg:w-72"
        />
        <ToggleGroup<StatusFilter>
          label="Quest status"
          value={status}
          onChange={filterSetter(setStatus)}
          options={[
            { value: 'available', label: 'Available', count: statusCounts.available },
            { value: 'locked', label: 'Locked', count: statusCounts.locked },
            { value: 'completed', label: 'Completed', count: statusCounts.completed },
            { value: 'all', label: 'All', count: statusCounts.all },
          ]}
        />
        <Select label="Map" value={mapId} onChange={(e) => filterSetter(setMapId)(e.target.value)} className="lg:w-52">
          <option value="all">All maps</option>
          {mapOptions.map((map) => (
            <option key={map.id} value={map.id}>
              {map.name}
            </option>
          ))}
        </Select>
        <div className="flex flex-wrap gap-4 text-sm">
          <Checkbox label="Kappa required" checked={kappaOnly} onChange={filterSetter(setKappaOnly)} />
          <Checkbox label="Lightkeeper required" checked={lightkeeperOnly} onChange={filterSetter(setLightkeeperOnly)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No quests match these filters">
          {status === 'available' ? 'Raise your player level or complete prerequisites to unlock more quests.' : 'Try clearing a filter.'}
        </EmptyState>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} quests
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.slice(0, visibleCount).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                status={statuses.get(task.id) ?? 'locked'}
                trader={tradersById.get(task.traderId)}
                mapName={task.mapId ? mapNames[task.mapId] : undefined}
                prerequisites={task.requirements
                  .filter((req) => req.status.includes('complete') && tasksById.has(req.taskId))
                  .map((req) => ({ id: req.taskId, name: tasksById.get(req.taskId)!.name, done: completed.has(req.taskId) }))}
                getUnfinishedPrerequisites={unfinishedPrerequisites}
                onSetCompleted={setCompleted}
              />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <Button className="self-center" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
              Show more quests
            </Button>
          )}
        </>
      )}
    </div>
  );
}

type TraderButtonProps = {
  label: string;
  imageLink?: string;
  active: boolean;
  done: number;
  total: number;
  onClick: () => void;
};

function TraderButton({ label, imageLink, active, done, total, onClick }: TraderButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
        active ? 'border-accent bg-accent/10 text-text' : 'border-border bg-surface text-muted hover:text-text',
      )}
    >
      {imageLink && <ItemIcon src={imageLink} size={24} className="rounded-full" />}
      <span className="font-medium">{label}</span>
      <span className="text-xs tabular-nums text-muted">
        {done}/{total}
      </span>
    </button>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
      {label}
    </label>
  );
}
