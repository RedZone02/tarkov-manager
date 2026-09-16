import type { GameMode } from '@/lib/game-mode';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { isUuid, randomUuid } from '@/lib/uuid';
import { DEFAULT_QUESTS, MAX_RAID_LOG_ENTRIES } from './defaults';
import type { Faction, HideoutProgress, QuestProgress, RaidLogEntry } from './types';

type Db = TypedSupabaseClient;

const MAX_ID_LENGTH = 64;
const MAX_MAP_NAME_LENGTH = 100;
const MAX_PLAYER_LEVEL = 100;
const MAX_STATION_LEVEL = 10;

function throwOnError<T extends { error: unknown }>(result: T): T {
  if (result.error) throw result.error;
  return result;
}

function isFaction(value: unknown): value is Faction {
  return value === 'BEAR' || value === 'USEC';
}

function clampInteger(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

export async function fetchQuestProgress(db: Db, userId: string, mode: GameMode): Promise<QuestProgress> {
  const [settings, completed] = await Promise.all([
    db.from('player_settings').select('player_level, faction').eq('user_id', userId).eq('mode', mode).maybeSingle(),
    db.from('completed_quests').select('task_id').eq('user_id', userId).eq('mode', mode),
  ]);
  throwOnError(settings);
  throwOnError(completed);

  return {
    completed: (completed.data ?? []).map((row) => row.task_id),
    playerLevel: settings.data?.player_level ?? DEFAULT_QUESTS.playerLevel,
    faction: settings.data?.faction ?? DEFAULT_QUESTS.faction,
  };
}

export async function saveCompletedQuests(db: Db, userId: string, mode: GameMode, taskIds: string[], done: boolean) {
  const ids = [...new Set(taskIds)].filter(isValidId);
  if (ids.length === 0) return;

  if (done) {
    throwOnError(
      await db
        .from('completed_quests')
        .upsert(
          ids.map((task_id) => ({ user_id: userId, mode, task_id })),
          { onConflict: 'user_id,mode,task_id', ignoreDuplicates: true },
        ),
    );
  } else {
    throwOnError(await db.from('completed_quests').delete().eq('user_id', userId).eq('mode', mode).in('task_id', ids));
  }
}

export async function savePlayerSettings(
  db: Db,
  userId: string,
  mode: GameMode,
  settings: { playerLevel?: number; faction?: Faction },
) {
  const playerLevel = settings.playerLevel === undefined ? undefined : clampInteger(settings.playerLevel, 1, MAX_PLAYER_LEVEL);
  throwOnError(
    await db.from('player_settings').upsert(
      {
        user_id: userId,
        mode,
        ...(playerLevel != null && { player_level: playerLevel }),
        ...(settings.faction && { faction: settings.faction }),
      },
      { onConflict: 'user_id,mode' },
    ),
  );
}

export async function clearQuestProgress(db: Db, userId: string, mode: GameMode) {
  const [completed, settings] = await Promise.all([
    db.from('completed_quests').delete().eq('user_id', userId).eq('mode', mode),
    db.from('player_settings').delete().eq('user_id', userId).eq('mode', mode),
  ]);
  throwOnError(completed);
  throwOnError(settings);
}

export async function fetchHideoutProgress(db: Db, userId: string, mode: GameMode): Promise<HideoutProgress> {
  const { data } = throwOnError(
    await db.from('hideout_levels').select('station_id, level').eq('user_id', userId).eq('mode', mode),
  );
  return { levels: Object.fromEntries((data ?? []).map((row) => [row.station_id, row.level])) };
}

export async function saveHideoutLevel(db: Db, userId: string, mode: GameMode, stationId: string, level: number) {
  const safeLevel = clampInteger(level, 0, MAX_STATION_LEVEL);
  if (!isValidId(stationId) || safeLevel === null) return;
  throwOnError(
    await db
      .from('hideout_levels')
      .upsert({ user_id: userId, mode, station_id: stationId, level: safeLevel }, { onConflict: 'user_id,mode,station_id' }),
  );
}

export async function clearHideoutProgress(db: Db, userId: string, mode: GameMode) {
  throwOnError(await db.from('hideout_levels').delete().eq('user_id', userId).eq('mode', mode));
}

export async function fetchRaidLog(db: Db, userId: string, mode: GameMode): Promise<RaidLogEntry[]> {
  const { data } = throwOnError(
    await db
      .from('raid_logs')
      .select('id, created_at, map_name, survived, total_cost, total_loot, item_count')
      .eq('user_id', userId)
      .eq('mode', mode)
      .order('created_at', { ascending: false })
      .limit(MAX_RAID_LOG_ENTRIES),
  );
  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    mapName: row.map_name,
    survived: row.survived,
    totalCost: row.total_cost,
    totalLoot: row.total_loot,
    itemCount: row.item_count,
  }));
}

function toRaidLogRow(userId: string, mode: GameMode, entry: RaidLogEntry) {
  const createdAt = new Date(entry.createdAt);
  return {
    id: isUuid(entry.id) ? entry.id : randomUuid(),
    user_id: userId,
    mode,
    map_name: String(entry.mapName ?? '').slice(0, MAX_MAP_NAME_LENGTH),
    survived: Boolean(entry.survived),
    total_cost: clampInteger(entry.totalCost, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ?? 0,
    total_loot: clampInteger(entry.totalLoot, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) ?? 0,
    item_count: clampInteger(entry.itemCount, 0, 2_147_483_647) ?? 0,
    created_at: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
  };
}

export async function saveRaidLogEntries(db: Db, userId: string, mode: GameMode, entries: RaidLogEntry[]) {
  if (entries.length === 0) return;
  throwOnError(
    await db
      .from('raid_logs')
      .upsert(
        entries.map((entry) => toRaidLogRow(userId, mode, entry)),
        { onConflict: 'id', ignoreDuplicates: true },
      ),
  );
}

export async function deleteRaidLogEntry(db: Db, userId: string, id: string) {
  if (!isUuid(id)) return;
  throwOnError(await db.from('raid_logs').delete().eq('user_id', userId).eq('id', id));
}

export async function clearRaidLog(db: Db, userId: string, mode: GameMode) {
  throwOnError(await db.from('raid_logs').delete().eq('user_id', userId).eq('mode', mode));
}

export async function importProgress(
  db: Db,
  userId: string,
  mode: GameMode,
  local: { quests: QuestProgress; hideout: HideoutProgress; raids: RaidLogEntry[] },
) {
  const completed = Array.isArray(local.quests.completed) ? local.quests.completed : [];
  await saveCompletedQuests(db, userId, mode, completed, true);

  const playerLevel = clampInteger(local.quests.playerLevel, 1, MAX_PLAYER_LEVEL) ?? DEFAULT_QUESTS.playerLevel;
  const faction = isFaction(local.quests.faction) ? local.quests.faction : DEFAULT_QUESTS.faction;
  if (playerLevel !== DEFAULT_QUESTS.playerLevel || faction !== DEFAULT_QUESTS.faction) {
    throwOnError(
      await db
        .from('player_settings')
        .upsert({ user_id: userId, mode, player_level: playerLevel, faction }, { onConflict: 'user_id,mode', ignoreDuplicates: true }),
    );
  }

  const localLevels = Object.entries(local.hideout.levels ?? {});
  if (localLevels.length > 0) {
    const remote = await fetchHideoutProgress(db, userId, mode);
    const upgrades = localLevels
      .map(([stationId, level]) => ({ stationId, level: clampInteger(level, 0, MAX_STATION_LEVEL) }))
      .filter(
        (entry): entry is { stationId: string; level: number } =>
          isValidId(entry.stationId) && entry.level !== null && entry.level > (remote.levels[entry.stationId] ?? 0),
      );
    if (upgrades.length > 0) {
      throwOnError(
        await db.from('hideout_levels').upsert(
          upgrades.map(({ stationId, level }) => ({ user_id: userId, mode, station_id: stationId, level })),
          { onConflict: 'user_id,mode,station_id' },
        ),
      );
    }
  }

  const raids = Array.isArray(local.raids) ? local.raids.slice(0, MAX_RAID_LOG_ENTRIES) : [];
  await saveRaidLogEntries(db, userId, mode, raids);
}
