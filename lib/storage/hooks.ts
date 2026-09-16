'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/context';
import type { GameMode } from '@/lib/game-mode';
import { getSupabaseBrowserClient, type TypedSupabaseClient } from '@/lib/supabase/client';
import {
  cloudProgressKey,
  DEFAULT_HIDEOUT,
  DEFAULT_QUESTS,
  EMPTY_RAID_LOG,
  localProgressKey,
  MAX_RAID_LOG_ENTRIES,
  type ProgressKind,
} from './defaults';
import {
  clearHideoutProgress,
  clearQuestProgress,
  clearRaidLog,
  deleteRaidLogEntry,
  fetchHideoutProgress,
  fetchQuestProgress,
  fetchRaidLog,
  saveCompletedQuests,
  saveHideoutLevel,
  savePlayerSettings,
  saveRaidLogEntries,
} from './remote';
import { getCloudStore, getLocalStore, getOverallSyncStatus, getSyncErrorMessage, subscribeSyncStatus } from './store';
import type { Faction, RaidLogEntry } from './types';

type Fetcher<T> = (db: TypedSupabaseClient, userId: string, mode: GameMode) => Promise<T>;

function useProgressStore<T>(kind: ProgressKind, mode: GameMode, fallback: T, fetcher: Fetcher<T>) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const store = userId
    ? getCloudStore(cloudProgressKey(userId, mode, kind), fallback, () => fetcher(getSupabaseBrowserClient(), userId, mode))
    : getLocalStore(localProgressKey(mode, kind), fallback);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const update = useCallback(
    (apply: (prev: T) => T, persist: (db: TypedSupabaseClient, userId: string) => Promise<void>) =>
      store.update(apply, userId ? () => persist(getSupabaseBrowserClient(), userId) : undefined),
    [store, userId],
  );

  return { value: snapshot.value, status: snapshot.status, update };
}

export function useQuestProgress(mode: GameMode) {
  const { value: progress, status, update } = useProgressStore('quests', mode, DEFAULT_QUESTS, fetchQuestProgress);
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);

  const setCompleted = useCallback(
    (taskIds: string[], done: boolean) =>
      update(
        (prev) => {
          const next = new Set(prev.completed);
          for (const id of taskIds) {
            if (done) next.add(id);
            else next.delete(id);
          }
          return { ...prev, completed: [...next] };
        },
        (db, userId) => saveCompletedQuests(db, userId, mode, taskIds, done),
      ),
    [update, mode],
  );
  const setPlayerLevel = useCallback(
    (playerLevel: number) =>
      update(
        (prev) => ({ ...prev, playerLevel }),
        (db, userId) => savePlayerSettings(db, userId, mode, { playerLevel }),
      ),
    [update, mode],
  );
  const setFaction = useCallback(
    (faction: Faction) =>
      update(
        (prev) => ({ ...prev, faction }),
        (db, userId) => savePlayerSettings(db, userId, mode, { faction }),
      ),
    [update, mode],
  );
  const reset = useCallback(
    () =>
      update(
        () => DEFAULT_QUESTS,
        (db, userId) => clearQuestProgress(db, userId, mode),
      ),
    [update, mode],
  );

  return { progress, completed, status, setCompleted, setPlayerLevel, setFaction, reset };
}

export function useHideoutProgress(mode: GameMode) {
  const { value: progress, status, update } = useProgressStore('hideout', mode, DEFAULT_HIDEOUT, fetchHideoutProgress);

  const setLevel = useCallback(
    (stationId: string, level: number) =>
      update(
        (prev) => ({ levels: { ...prev.levels, [stationId]: level } }),
        (db, userId) => saveHideoutLevel(db, userId, mode, stationId, level),
      ),
    [update, mode],
  );
  const reset = useCallback(
    () =>
      update(
        () => DEFAULT_HIDEOUT,
        (db, userId) => clearHideoutProgress(db, userId, mode),
      ),
    [update, mode],
  );

  return { levels: progress.levels, status, setLevel, reset };
}

export function useRaidLog(mode: GameMode) {
  const { value: entries, status, update } = useProgressStore('raids', mode, EMPTY_RAID_LOG, fetchRaidLog);

  const addEntry = useCallback(
    (entry: RaidLogEntry) =>
      update(
        (prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, MAX_RAID_LOG_ENTRIES),
        (db, userId) => saveRaidLogEntries(db, userId, mode, [entry]),
      ),
    [update, mode],
  );
  const removeEntry = useCallback(
    (id: string) =>
      update(
        (prev) => prev.filter((e) => e.id !== id),
        (db, userId) => deleteRaidLogEntry(db, userId, id),
      ),
    [update],
  );
  const clear = useCallback(
    () =>
      update(
        () => EMPTY_RAID_LOG,
        (db, userId) => clearRaidLog(db, userId, mode),
      ),
    [update, mode],
  );

  return { entries, status, addEntry, removeEntry, clear };
}

const getServerSyncStatus = () => 'idle' as const;
const getServerSyncError = () => null;

export function useSyncStatus() {
  const status = useSyncExternalStore(subscribeSyncStatus, getOverallSyncStatus, getServerSyncStatus);
  const error = useSyncExternalStore(subscribeSyncStatus, getSyncErrorMessage, getServerSyncError);
  return { status, error };
}
