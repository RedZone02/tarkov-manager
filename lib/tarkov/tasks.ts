import type { GameMode } from '@/lib/game-mode';
import { loadRaw, memoize, translate } from './source';
import type { Position, Task, TaskFaction, TaskObjectiveLocation } from './types';

type RawObjective = {
  id: string;
  description: string;
  type: string;
  optional: boolean;
  count?: number | null;
  maps?: string[];
  zones?: { map: string; position: Position }[];
  possibleLocations?: { map: string; positions: Position[] }[];
};

type RawTask = {
  id: string;
  name: string;
  normalizedName: string;
  trader: string;
  map: string | null;
  wikiLink: string | null;
  taskImageLink: string | null;
  minPlayerLevel: number;
  kappaRequired: boolean;
  lightkeeperRequired: boolean;
  factionName: string;
  experience: number;
  taskRequirements: { task: string; status: string[] }[];
  objectives: RawObjective[];
  finishRewards?: { items?: { item: string }[] };
};

type RawTasksFile = { tasks: Record<string, RawTask> };

function toLocations(objective: RawObjective): TaskObjectiveLocation[] {
  return [
    ...(objective.zones ?? []).map((zone) => ({ mapId: zone.map, position: zone.position })),
    ...(objective.possibleLocations ?? []).flatMap((location) =>
      location.positions.map((position) => ({ mapId: location.map, position })),
    ),
  ];
}

function toFaction(value: string): TaskFaction {
  return value === 'BEAR' || value === 'USEC' ? value : 'Any';
}

export function getTasks(mode: GameMode): Promise<Task[]> {
  return memoize(`${mode}:tasks`, async () => {
    const { data, locale } = await loadRaw<RawTasksFile>(mode, 'tasks');
    return Object.values(data.tasks).map((raw) => ({
      id: raw.id,
      name: translate(locale, raw.name),
      normalizedName: raw.normalizedName,
      traderId: raw.trader,
      mapId: raw.map,
      minPlayerLevel: raw.minPlayerLevel,
      kappaRequired: raw.kappaRequired,
      lightkeeperRequired: raw.lightkeeperRequired,
      faction: toFaction(raw.factionName),
      experience: raw.experience,
      wikiLink: raw.wikiLink,
      imageLink: raw.taskImageLink,
      requirements: raw.taskRequirements.map((req) => ({ taskId: req.task, status: req.status })),
      objectives: raw.objectives.map((objective) => ({
        id: objective.id,
        type: objective.type,
        description: translate(locale, objective.description),
        optional: objective.optional,
        count: objective.count ?? null,
        mapIds: objective.maps ?? [],
        locations: toLocations(objective),
      })),
      rewardItemIds: (raw.finishRewards?.items ?? []).map((reward) => reward.item),
    }));
  });
}
