export type Position = { x: number; y: number; z: number };

export type Trader = {
  id: string;
  name: string;
  normalizedName: string;
  imageLink: string;
  maxLevel: number;
};

export type TraderPrice = { traderId: string; price: number };

export type ItemSummary = {
  id: string;
  name: string;
  shortName: string;
  iconLink: string;
  types: string[];
  basePrice: number;
  avg24hPrice: number | null;
  lastLowPrice: number | null;
  bestTraderSell: TraderPrice | null;
  cheapestTraderBuy: (TraderPrice & { minTraderLevel: number }) | null;
  unitPrice: number | null;
};

export type AmmoStats = {
  caliber: string;
  damage: number;
  penetrationPower: number;
  armorDamage: number;
  fragmentationChance: number;
  initialSpeed: number;
  projectileCount: number;
  tracer: boolean;
};

export type WeaponStats = {
  ergonomics: number | null;
  recoilVertical: number | null;
  recoilHorizontal: number | null;
  recoilModifier: number | null;
  caliber: string | null;
};

export type PresetInfo = {
  baseItemId: string;
  isDefault: boolean;
  ergonomics: number | null;
  recoilVertical: number | null;
  recoilHorizontal: number | null;
  moa: number | null;
  parts: { itemId: string; count: number }[];
};

export type CatalogItem = ItemSummary & {
  ammo: AmmoStats | null;
  stats: WeaponStats | null;
  preset: PresetInfo | null;
  weaponClass: string | null;
};

export type AmmoRound = ItemSummary & AmmoStats;

export type WeaponBuildPart = {
  itemId: string;
  name: string;
  iconLink: string;
  count: number;
  unitPrice: number | null;
};

export type WeaponBuild = {
  id: string;
  name: string;
  weaponId: string;
  weaponName: string;
  weaponClass: string;
  caliber: string | null;
  iconLink: string;
  ergonomics: number | null;
  recoilVertical: number | null;
  recoilHorizontal: number | null;
  moa: number | null;
  baseline: { ergonomics: number | null; recoilVertical: number | null } | null;
  partsCost: number;
  parts: WeaponBuildPart[];
};

export type TaskObjectiveLocation = { mapId: string; position: Position };

export type TaskObjective = {
  id: string;
  type: string;
  description: string;
  optional: boolean;
  count: number | null;
  mapIds: string[];
  locations: TaskObjectiveLocation[];
};

export type TaskFaction = 'Any' | 'BEAR' | 'USEC';

export type Task = {
  id: string;
  name: string;
  normalizedName: string;
  traderId: string;
  mapId: string | null;
  minPlayerLevel: number;
  kappaRequired: boolean;
  lightkeeperRequired: boolean;
  faction: TaskFaction;
  experience: number;
  wikiLink: string | null;
  imageLink: string | null;
  requirements: { taskId: string; status: string[] }[];
  objectives: TaskObjective[];
  rewardItemIds: string[];
};

export type HideoutItemRequirement = {
  itemId: string;
  name: string;
  shortName: string;
  iconLink: string;
  count: number;
  foundInRaid: boolean;
  unitPrice: number | null;
};

export type HideoutLevel = {
  level: number;
  constructionTime: number;
  items: HideoutItemRequirement[];
  stations: { stationId: string; name: string; level: number }[];
  traders: { traderId: string; name: string; level: number }[];
};

export type HideoutStation = {
  id: string;
  name: string;
  normalizedName: string;
  imageLink: string;
  levels: HideoutLevel[];
};

export type MapBoss = { name: string; spawnChance: number };

export type MapExtract = { id: string; name: string; faction: string; position: Position | null };

export type MapSpawn = { position: Position; zoneName: string };

export type MapInfo = {
  id: string;
  name: string;
  normalizedName: string;
  raidDuration: number | null;
  players: string | null;
  wiki: string | null;
  bosses: MapBoss[];
  extracts: MapExtract[];
  spawns: MapSpawn[];
};
