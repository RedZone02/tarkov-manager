import type { GameMode } from '@/lib/game-mode';
import type { HideoutProgress, QuestProgress, RaidLogEntry } from './types';

export type ProgressKind = 'quests' | 'hideout' | 'raids';

export const DEFAULT_QUESTS: QuestProgress = { completed: [], playerLevel: 1, faction: 'USEC' };
export const DEFAULT_HIDEOUT: HideoutProgress = { levels: {} };
export const EMPTY_RAID_LOG: RaidLogEntry[] = [];
export const MAX_RAID_LOG_ENTRIES = 200;

export function localProgressKey(mode: GameMode, kind: ProgressKind) {
  return `${mode}:${kind}`;
}

export const CLOUD_CACHE_PREFIX = 'cloud:';

export function cloudProgressKey(userId: string, mode: GameMode, kind: ProgressKind) {
  return `${CLOUD_CACHE_PREFIX}${userId}:${mode}:${kind}`;
}
