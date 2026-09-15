import type { Faction } from '@/lib/storage/types';
import type { Task } from '@/lib/tarkov/types';

export type TaskStatus = 'completed' | 'available' | 'locked';

export function isForFaction(task: Task, faction: Faction): boolean {
  return task.faction === 'Any' || task.faction === faction;
}

function completionRequirements(task: Task): string[] {
  return task.requirements.filter((req) => req.status.includes('complete')).map((req) => req.taskId);
}

export function getTaskStatus(task: Task, completed: Set<string>, playerLevel: number): TaskStatus {
  if (completed.has(task.id)) return 'completed';
  const prerequisitesMet = completionRequirements(task).every((id) => completed.has(id));
  return prerequisitesMet && task.minPlayerLevel <= playerLevel ? 'available' : 'locked';
}

export function collectChain(targetIds: string[], tasksById: Map<string, Task>): Task[] {
  const chain = new Map<string, Task>();
  const stack = [...targetIds];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const task = tasksById.get(id);
    if (!task || chain.has(id)) continue;
    chain.set(id, task);
    stack.push(...completionRequirements(task));
  }
  return orderByDependencies([...chain.values()]);
}

export function orderByDependencies(tasks: Task[]): Task[] {
  const ids = new Set(tasks.map((t) => t.id));
  const remaining = new Map(tasks.map((t) => [t.id, completionRequirements(t).filter((id) => ids.has(id)).length]));
  const dependents = new Map<string, Task[]>();
  for (const task of tasks) {
    for (const reqId of completionRequirements(task)) {
      if (ids.has(reqId)) dependents.set(reqId, [...(dependents.get(reqId) ?? []), task]);
    }
  }

  const byLevel = (a: Task, b: Task) => a.minPlayerLevel - b.minPlayerLevel || a.name.localeCompare(b.name);
  let ready = tasks.filter((t) => remaining.get(t.id) === 0).sort(byLevel);
  const ordered: Task[] = [];
  while (ready.length > 0) {
    const [next, ...rest] = ready;
    ordered.push(next);
    const unlocked = (dependents.get(next.id) ?? []).filter((dep) => {
      const count = remaining.get(dep.id)! - 1;
      remaining.set(dep.id, count);
      return count === 0;
    });
    ready = [...rest, ...unlocked].sort(byLevel);
  }

  if (ordered.length < tasks.length) {
    const placed = new Set(ordered.map((t) => t.id));
    ordered.push(...tasks.filter((t) => !placed.has(t.id)).sort(byLevel));
  }
  return ordered;
}
