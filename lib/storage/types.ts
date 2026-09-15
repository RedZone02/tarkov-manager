export type Faction = 'BEAR' | 'USEC';

export type QuestProgress = {
  completed: string[];
  playerLevel: number;
  faction: Faction;
};

export type HideoutProgress = {
  levels: Record<string, number>;
};

export type RaidLogEntry = {
  id: string;
  createdAt: string;
  mapName: string;
  survived: boolean;
  totalCost: number;
  totalLoot: number;
  itemCount: number;
};
