import type { Position } from '@/lib/tarkov/types';

export type RouteStop = {
  id: string;
  taskName: string;
  label: string;
  positions: Position[];
};

export type PlannedStop = RouteStop & { position: Position };

function distance(a: Position, b: Position) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function closest(from: Position, positions: Position[]) {
  let best = positions[0];
  let bestDistance = distance(from, best);
  for (const position of positions.slice(1)) {
    const d = distance(from, position);
    if (d < bestDistance) {
      best = position;
      bestDistance = d;
    }
  }
  return { position: best, distance: bestDistance };
}

export function planRoute(stops: RouteStop[], start: Position | null, end: Position | null): PlannedStop[] {
  const remaining = stops.filter((stop) => stop.positions.length > 0);
  if (remaining.length === 0) return [];

  const ordered: PlannedStop[] = [];
  let current = start;

  if (!current) {
    let firstIndex = 0;
    if (end) {
      const distances = remaining.map((stop) => closest(end, stop.positions).distance);
      firstIndex = distances.indexOf(Math.max(...distances));
    }
    const [first] = remaining.splice(firstIndex, 1);
    ordered.push({ ...first, position: first.positions[0] });
    current = first.positions[0];
  }

  while (remaining.length > 0) {
    let bestIndex = 0;
    let best = closest(current, remaining[0].positions);
    for (let i = 1; i < remaining.length; i++) {
      const candidate = closest(current, remaining[i].positions);
      if (candidate.distance < best.distance) {
        best = candidate;
        bestIndex = i;
      }
    }
    const [stop] = remaining.splice(bestIndex, 1);
    ordered.push({ ...stop, position: best.position });
    current = best.position;
  }

  return ordered;
}
