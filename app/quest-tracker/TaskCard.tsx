'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { TaskStatus } from '@/lib/quests';
import type { Task, Trader } from '@/lib/tarkov/types';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ItemIcon } from '../components/ui/ItemIcon';

const statusBadge: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  completed: { label: 'Completed', tone: 'success' },
  available: { label: 'Available', tone: 'info' },
  locked: { label: 'Locked', tone: 'neutral' },
};

type TaskCardProps = {
  task: Task;
  status: TaskStatus;
  trader: Trader | undefined;
  mapName: string | undefined;
  prerequisites: { id: string; name: string; done: boolean }[];
  getUnfinishedPrerequisites: (taskId: string) => string[];
  onSetCompleted: (taskIds: string[], done: boolean) => void;
};

export default function TaskCard({
  task,
  status,
  trader,
  mapName,
  prerequisites,
  getUnfinishedPrerequisites,
  onSetCompleted,
}: TaskCardProps) {
  const [pendingPrerequisites, setPendingPrerequisites] = useState<string[] | null>(null);
  const badge = statusBadge[status];

  function handleComplete() {
    const unfinished = getUnfinishedPrerequisites(task.id);
    if (unfinished.length === 0) onSetCompleted([task.id], true);
    else setPendingPrerequisites(unfinished);
  }

  function confirm(ids: string[]) {
    onSetCompleted(ids, true);
    setPendingPrerequisites(null);
  }

  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-surface p-4',
        status === 'completed' ? 'border-success/40' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        {trader && <ItemIcon src={trader.imageLink} size={40} className="rounded-full" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{task.name}</h3>
          <p className="text-xs text-muted">
            {trader?.name ?? 'Unknown trader'} · Level {task.minPlayerLevel}
            {mapName ? ` · ${mapName}` : ''}
          </p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      {(task.kappaRequired || task.lightkeeperRequired || task.faction !== 'Any') && (
        <div className="flex flex-wrap gap-1.5">
          {task.kappaRequired && <Badge tone="warning">Kappa</Badge>}
          {task.lightkeeperRequired && <Badge tone="info">Lightkeeper</Badge>}
          {task.faction !== 'Any' && <Badge>{task.faction} only</Badge>}
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted hover:text-text">
          {task.objectives.length} objective{task.objectives.length === 1 ? '' : 's'}
          {prerequisites.length > 0 && ` · ${prerequisites.length} prerequisite${prerequisites.length === 1 ? '' : 's'}`}
        </summary>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
          {task.objectives.map((objective) => (
            <li key={objective.id} className={cn(objective.optional && 'text-muted')}>
              {objective.description}
              {objective.optional && ' (optional)'}
            </li>
          ))}
        </ul>
        {prerequisites.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Requires</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {prerequisites.map((prereq) => (
                <li key={prereq.id}>
                  <Badge tone={prereq.done ? 'success' : 'neutral'}>
                    {prereq.done && <span aria-hidden>✓</span>}
                    {prereq.name}
                    <span className="sr-only">{prereq.done ? ' (done)' : ' (not done)'}</span>
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {pendingPrerequisites ? (
        <div role="group" aria-label="Confirm completion" className="mt-auto rounded-lg bg-surface-2 p-3 text-sm">
          <p>
            {pendingPrerequisites.length} unfinished prerequisite{pendingPrerequisites.length === 1 ? '' : 's'} come before
            this quest. Mark {pendingPrerequisites.length === 1 ? 'it' : 'them'} complete too?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={() => confirm([...pendingPrerequisites, task.id])}>
              Complete all {pendingPrerequisites.length + 1}
            </Button>
            <Button size="sm" onClick={() => confirm([task.id])}>
              Only this quest
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPendingPrerequisites(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {status === 'completed' ? (
            <Button size="sm" onClick={() => onSetCompleted([task.id], false)}>
              Mark not done
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={handleComplete}>
              Mark complete
            </Button>
          )}
          {task.wikiLink && (
            <a
              href={task.wikiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-sm text-muted hover:text-accent"
            >
              Wiki <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
}
