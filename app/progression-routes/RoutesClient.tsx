'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { GameMode } from '@/lib/game-mode';
import { getTaskStatus, isForFaction, type TaskStatus } from '@/lib/quests';
import { useQuestProgress } from '@/lib/storage/hooks';
import type { Task, Trader } from '@/lib/tarkov/types';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatTile } from '../components/ui/StatTile';
import { ToggleGroup } from '../components/ui/ToggleGroup';

export type ProgressionRoute = {
  id: string;
  title: string;
  icon: string;
  description: string;
  taskIds: string[];
};

const LEVEL_BAND = 10;

const statusBadge: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  completed: { label: 'Done', tone: 'success' },
  available: { label: 'Available', tone: 'info' },
  locked: { label: 'Locked', tone: 'neutral' },
};

type RoutesClientProps = {
  mode: GameMode;
  routes: ProgressionRoute[];
  tasks: Task[];
  traders: Trader[];
};

export default function RoutesClient({ mode, routes, tasks, traders }: RoutesClientProps) {
  const { progress, completed, setCompleted } = useQuestProgress(mode);
  const [routeId, setRouteId] = useState(routes[0].id);
  const [hideCompleted, setHideCompleted] = useState(false);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const traderNames = useMemo(() => new Map(traders.map((t) => [t.id, t.name])), [traders]);
  const route = routes.find((r) => r.id === routeId) ?? routes[0];

  const steps = useMemo(
    () =>
      route.taskIds
        .map((id) => tasksById.get(id))
        .filter((task): task is Task => task !== undefined && isForFaction(task, progress.faction)),
    [route, tasksById, progress.faction],
  );

  const statuses = useMemo(
    () => new Map(steps.map((t) => [t.id, getTaskStatus(t, completed, progress.playerLevel)])),
    [steps, completed, progress.playerLevel],
  );
  const doneCount = steps.filter((t) => statuses.get(t.id) === 'completed').length;
  const nextUp = steps.filter((t) => statuses.get(t.id) === 'available');

  const rows = useMemo(() => {
    const result: { task: Task; step: number; heading: number | null }[] = [];
    let highestBand = -1;
    for (const [index, task] of steps.entries()) {
      const band = Math.floor(task.minPlayerLevel / LEVEL_BAND) * LEVEL_BAND;
      const heading = band > highestBand ? band : null;
      highestBand = Math.max(highestBand, band);
      if (!(hideCompleted && completed.has(task.id))) result.push({ task, step: index + 1, heading });
    }
    return result;
  }, [steps, hideCompleted, completed]);

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        label="Progression route"
        value={route.id}
        onChange={setRouteId}
        options={routes.map((r) => ({ value: r.id, label: `${r.icon} ${r.title}` }))}
        className="self-start"
      />

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">
              <span aria-hidden>{route.icon}</span> {route.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{route.description}</p>
          </div>
          {route.id === 'unheard' && mode === 'regular' && <Badge tone="warning">The Mark is only rewarded in PvE</Badge>}
        </div>
        <ProgressBar value={doneCount} max={steps.length} label={`${progress.faction} route progress`} />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Quests done" value={`${doneCount}/${steps.length}`} tone="success" />
          <StatTile label="Remaining" value={steps.length - doneCount} />
          <StatTile label="Available now" value={nextUp.length} tone="warning" hint={`At level ${progress.playerLevel}`} />
        </div>
        {nextUp.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Next up</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {nextUp.slice(0, 6).map((task) => (
                <li key={task.id}>
                  <Badge tone="info">{task.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {steps.length === 0 ? (
        <EmptyState icon="🛣️" title="No route data">
          tarkov.dev didn&apos;t return the quests for this route.
        </EmptyState>
      ) : (
        <section aria-label={`${route.title} quest order`} className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2 self-start text-sm">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Hide completed quests
          </label>
          <ol className="overflow-hidden rounded-xl border border-border bg-surface">
            {rows.map(({ task, step, heading }) => {
              const status = statuses.get(task.id) ?? 'locked';
              const done = status === 'completed';
              const badge = statusBadge[status];
              return (
                <li key={task.id} className="border-b border-border last:border-0">
                  {heading !== null && (
                    <p className="bg-surface-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Level {Math.max(1, heading)}+
                    </p>
                  )}
                  <div className={cn('flex items-center gap-3 px-4 py-3', done && 'text-muted')}>
                    <button
                      type="button"
                      aria-pressed={done}
                      aria-label={`${done ? 'Mark not done' : 'Mark complete'}: ${task.name}`}
                      onClick={() => setCompleted([task.id], !done)}
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors',
                        done ? 'border-success bg-success text-bg' : 'border-border hover:border-accent',
                      )}
                    >
                      {done && (
                        <svg aria-hidden className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5 9-10" />
                        </svg>
                      )}
                    </button>
                    <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted">{step}</span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('font-medium', done && 'line-through')}>{task.name}</p>
                      <p className="text-xs text-muted">
                        {traderNames.get(task.traderId) ?? 'Unknown trader'} · Level {task.minPlayerLevel}
                      </p>
                    </div>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
