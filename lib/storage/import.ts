import type { GameMode } from '@/lib/game-mode';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { DEFAULT_HIDEOUT, DEFAULT_QUESTS, EMPTY_RAID_LOG, localProgressKey, type ProgressKind } from './defaults';
import { hasStored, readStored, removeStored } from './local';
import { importProgress } from './remote';

const MODES: GameMode[] = ['regular', 'pve'];
const KINDS: ProgressKind[] = ['quests', 'hideout', 'raids'];

const inFlight = new Map<string, Promise<boolean>>();

function hasLocalData(mode: GameMode) {
  return KINDS.some((kind) => hasStored(localProgressKey(mode, kind)));
}

export function hasLocalProgress() {
  return MODES.some(hasLocalData);
}

async function runImport(db: TypedSupabaseClient, userId: string) {
  let imported = false;
  for (const mode of MODES) {
    if (!hasLocalData(mode)) continue;
    await importProgress(db, userId, mode, {
      quests: readStored(localProgressKey(mode, 'quests'), DEFAULT_QUESTS),
      hideout: readStored(localProgressKey(mode, 'hideout'), DEFAULT_HIDEOUT),
      raids: readStored(localProgressKey(mode, 'raids'), EMPTY_RAID_LOG),
    });
    KINDS.forEach((kind) => removeStored(localProgressKey(mode, kind)));
    imported = true;
  }
  return imported;
}

export function importLocalProgress(db: TypedSupabaseClient, userId: string): Promise<boolean> {
  let job = inFlight.get(userId);
  if (!job) {
    job = runImport(db, userId).finally(() => inFlight.delete(userId));
    inFlight.set(userId, job);
  }
  return job;
}
