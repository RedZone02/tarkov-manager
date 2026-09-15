'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { GameMode } from '@/lib/game-mode';
import { readStored, subscribeStored, writeStored } from './local';
import type { Faction, HideoutProgress, QuestProgress, RaidLogEntry } from './types';

const DEFAULT_QUESTS: QuestProgress = { completed: [], playerLevel: 1, faction: 'USEC' };
const DEFAULT_HIDEOUT: HideoutProgress = { levels: {} };
const EMPTY_RAID_LOG: RaidLogEntry[] = [];
const MAX_RAID_LOG_ENTRIES = 200;

export function useStoredState<T>(key: string, fallback: T) {
  const subscribe = useCallback((onChange: () => void) => subscribeStored(key, onChange), [key]);
  const getSnapshot = useCallback(() => readStored(key, fallback), [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback(
    (next: (prev: T) => T) => writeStored(key, next(readStored(key, fallback))),
    [key, fallback],
  );
  return [value, update] as const;
}

export function useQuestProgress(mode: GameMode) {
  const [progress, update] = useStoredState(`${mode}:quests`, DEFAULT_QUESTS);
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);

  const setCompleted = useCallback(
    (taskIds: string[], done: boolean) =>
      update((prev) => {
        const next = new Set(prev.completed);
        for (const id of taskIds) {
          if (done) next.add(id);
          else next.delete(id);
        }
        return { ...prev, completed: [...next] };
      }),
    [update],
  );
  const setPlayerLevel = useCallback((playerLevel: number) => update((prev) => ({ ...prev, playerLevel })), [update]);
  const setFaction = useCallback((faction: Faction) => update((prev) => ({ ...prev, faction })), [update]);
  const reset = useCallback(() => update(() => DEFAULT_QUESTS), [update]);

  return { progress, completed, setCompleted, setPlayerLevel, setFaction, reset };
}

export function useHideoutProgress(mode: GameMode) {
  const [progress, update] = useStoredState(`${mode}:hideout`, DEFAULT_HIDEOUT);

  const setLevel = useCallback(
    (stationId: string, level: number) => update((prev) => ({ levels: { ...prev.levels, [stationId]: level } })),
    [update],
  );
  const reset = useCallback(() => update(() => DEFAULT_HIDEOUT), [update]);

  return { levels: progress.levels, setLevel, reset };
}

export function useRaidLog(mode: GameMode) {
  const [entries, update] = useStoredState(`${mode}:raids`, EMPTY_RAID_LOG);

  const addEntry = useCallback(
    (entry: RaidLogEntry) => update((prev) => [entry, ...prev].slice(0, MAX_RAID_LOG_ENTRIES)),
    [update],
  );
  const removeEntry = useCallback((id: string) => update((prev) => prev.filter((e) => e.id !== id)), [update]);
  const clear = useCallback(() => update(() => EMPTY_RAID_LOG), [update]);

  return { entries, addEntry, removeEntry, clear };
}
