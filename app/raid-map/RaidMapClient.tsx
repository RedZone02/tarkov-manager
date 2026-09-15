'use client';

import { useMemo, useState } from 'react';
import type { GameMode } from '@/lib/game-mode';
import { getTaskStatus, isForFaction } from '@/lib/quests';
import { planRoute, type RouteStop } from '@/lib/route-planner';
import { useQuestProgress } from '@/lib/storage/hooks';
import { getProjection, projectPosition } from '@/lib/tarkov/map-projections';
import type { MapInfo, Task } from '@/lib/tarkov/types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Select } from '../components/ui/Select';
import MapView, { type MapMarker } from './MapView';

const DEFAULT_MAP = 'customs';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

type RaidMapClientProps = {
  mode: GameMode;
  maps: MapInfo[];
  tasks: Task[];
};

export default function RaidMapClient({ mode, maps, tasks }: RaidMapClientProps) {
  const { progress, completed } = useQuestProgress(mode);
  const [mapId, setMapId] = useState(() => (maps.find((m) => m.normalizedName === DEFAULT_MAP) ?? maps[0])?.id ?? '');
  const [excludedTaskIds, setExcludedTaskIds] = useState<Set<string>>(() => new Set());
  const [spawnIndex, setSpawnIndex] = useState(-1);
  const [extractId, setExtractId] = useState('');
  const [showRoute, setShowRoute] = useState(false);

  const map = maps.find((m) => m.id === mapId) ?? maps[0];
  const projection = map ? getProjection(map.normalizedName) : null;

  const pmcExtracts = useMemo(
    () => (map?.extracts ?? []).filter((extract) => extract.position !== null && extract.faction !== 'scav'),
    [map],
  );
  const selectedExtract = pmcExtracts.find((e) => e.id === extractId) ?? pmcExtracts[0] ?? null;

  const mapQuests = useMemo(
    () =>
      map
        ? tasks.filter(
            (task) =>
              isForFaction(task, progress.faction) &&
              getTaskStatus(task, completed, progress.playerLevel) === 'available' &&
              task.objectives.some((o) => o.locations.some((l) => l.mapId === map.id)),
          )
        : [],
    [tasks, map, progress.faction, progress.playerLevel, completed],
  );

  const stops = useMemo<RouteStop[]>(
    () =>
      map
        ? mapQuests
            .filter((task) => !excludedTaskIds.has(task.id))
            .flatMap((task) =>
              task.objectives
                .filter((objective) => !objective.optional)
                .map((objective) => ({
                  id: objective.id,
                  taskName: task.name,
                  label: objective.description,
                  positions: objective.locations.filter((l) => l.mapId === map.id).map((l) => l.position),
                }))
                .filter((stop) => stop.positions.length > 0),
            )
        : [],
    [mapQuests, excludedTaskIds, map],
  );

  const spawnPosition = spawnIndex >= 0 ? (map?.spawns[spawnIndex]?.position ?? null) : null;
  const planned = useMemo(
    () => planRoute(stops, spawnPosition, selectedExtract?.position ?? null),
    [stops, spawnPosition, selectedExtract],
  );

  const { markers, path } = useMemo(() => {
    if (!projection) return { markers: [] as MapMarker[], path: [] };
    const project = (position: { x: number; z: number }) => projectPosition(position, projection);

    const result: MapMarker[] = pmcExtracts.map((extract) => ({
      id: `extract-${extract.id}`,
      kind: 'extract',
      point: project(extract.position!),
      label: `Extract: ${extract.name}`,
    }));

    if (showRoute) {
      planned.forEach((stop, index) =>
        result.push({ id: `stop-${stop.id}`, kind: 'objective', point: project(stop.position), label: `${index + 1}. ${stop.taskName}: ${stop.label}`, step: index + 1 }),
      );
    } else {
      for (const stop of stops) {
        stop.positions.forEach((position, index) =>
          result.push({ id: `objective-${stop.id}-${index}`, kind: 'objective', point: project(position), label: `${stop.taskName}: ${stop.label}` }),
        );
      }
    }
    if (spawnPosition) result.push({ id: 'spawn', kind: 'spawn', point: project(spawnPosition), label: 'Your spawn' });

    const routePath = showRoute
      ? [spawnPosition, ...planned.map((stop) => stop.position), selectedExtract?.position ?? null]
          .filter((position) => position !== null)
          .map(project)
      : [];
    return { markers: result, path: routePath };
  }, [projection, pmcExtracts, showRoute, planned, stops, spawnPosition, selectedExtract]);

  if (!map) {
    return <EmptyState icon="🗺️" title="No map data available" />;
  }

  function selectMap(id: string) {
    setMapId(id);
    setSpawnIndex(-1);
    setExtractId('');
    setShowRoute(false);
    setExcludedTaskIds(new Set());
  }

  function toggleTask(taskId: string) {
    setExcludedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <Select label="Map" value={map.id} onChange={(e) => selectMap(e.target.value)}>
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>

        <Card className="flex flex-col gap-3 text-sm">
          <CardTitle>{map.name}</CardTitle>
          <dl className="grid grid-cols-2 gap-2">
            <div>
              <dt className="text-xs text-muted">Raid time</dt>
              <dd className="font-medium">{map.raidDuration ? `${map.raidDuration} min` : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Players</dt>
              <dd className="font-medium">{map.players ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">PMC extracts</dt>
              <dd className="font-medium">{pmcExtracts.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Your quests here</dt>
              <dd className="font-medium">{mapQuests.length}</dd>
            </div>
          </dl>
          {map.bosses.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Bosses &amp; spawns</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {map.bosses.map((boss) => (
                  <li key={boss.name}>
                    <Badge tone="accent">
                      {boss.name} {Math.round(boss.spawnChance * 100)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {map.wiki && (
            <a href={map.wiki} target="_blank" rel="noopener noreferrer" className="self-start text-muted hover:text-accent">
              Wiki <span aria-hidden>↗</span>
            </a>
          )}
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>Available quests</CardTitle>
          <p className="text-xs text-muted">
            Based on your Quest Tracker progress (level {progress.playerLevel}, {progress.faction}). Untick a quest to leave it
            out of the route.
          </p>
          {mapQuests.length === 0 ? (
            <p className="text-sm text-muted">No available quests have marked objectives on this map.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {mapQuests.map((task) => (
                <li key={task.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-sm hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={!excludedTaskIds.has(task.id)}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5 size-4 accent-[var(--accent)]"
                    />
                    <span>{task.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>Route</CardTitle>
          <Select label="Start" value={spawnIndex} onChange={(e) => setSpawnIndex(Number(e.target.value))}>
            <option value={-1}>At the first objective</option>
            {map.spawns.map((spawn, index) => (
              <option key={index} value={index}>
                {UUID_PATTERN.test(spawn.zoneName) ? `PMC spawn ${index + 1}` : `${spawn.zoneName} (${index + 1})`}
              </option>
            ))}
          </Select>
          <Select label="Extract" value={selectedExtract?.id ?? ''} onChange={(e) => setExtractId(e.target.value)}>
            {pmcExtracts.length === 0 && <option value="">No extracts with known positions</option>}
            {pmcExtracts.map((extract) => (
              <option key={extract.id} value={extract.id}>
                {extract.name}
                {extract.faction === 'shared' ? ' (shared)' : ''}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={() => setShowRoute(true)} disabled={stops.length === 0}>
            {showRoute ? 'Route shown on map' : 'Generate route'}
          </Button>
          {stops.length === 0 && <p className="text-xs text-muted">Select at least one quest with objectives on this map.</p>}

          {showRoute && planned.length > 0 && (
            <ol className="flex flex-col gap-2 text-sm">
              {planned.map((stop, index) => (
                <li key={stop.id} className="flex gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
                    {index + 1}
                  </span>
                  <span>
                    <span className="font-medium">{stop.taskName}</span>
                    <span className="block text-muted">{stop.label}</span>
                  </span>
                </li>
              ))}
              {selectedExtract && (
                <li className="flex gap-2">
                  <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-md bg-success text-xs font-bold text-bg">
                    ⇥
                  </span>
                  <span className="font-medium">Extract at {selectedExtract.name}</span>
                </li>
              )}
            </ol>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {projection ? (
          <MapView key={map.id} projection={projection} markers={markers} path={path} />
        ) : (
          <EmptyState icon="🗺️" title="No interactive map for this location">
            Extracts and quests are still listed on the left.
          </EmptyState>
        )}
        <ul className="flex flex-wrap gap-4 text-xs text-muted" aria-label="Map legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-sm bg-success" /> Extract
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full bg-accent" /> Quest objective
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-3 rounded-full bg-info" /> Spawn
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-5 bg-warning" /> Route
          </li>
        </ul>
      </div>
    </div>
  );
}
