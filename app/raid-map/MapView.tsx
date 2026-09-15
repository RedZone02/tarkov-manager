'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projectBounds, type MapProjection, type Point } from '@/lib/tarkov/map-projections';
import { Button } from '../components/ui/Button';

export type MapMarker = {
  id: string;
  kind: 'extract' | 'objective' | 'spawn';
  point: Point;
  label: string;
  step?: number;
};

type ViewBox = { x: number; y: number; width: number; height: number };

const markerFill: Record<MapMarker['kind'], string> = {
  extract: 'var(--success)',
  objective: 'var(--accent)',
  spawn: 'var(--info)',
};

const ZOOM_STEP = 1.4;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 1.5;

function keepBaseLayer(svgText: string, baseLayer: string | null): string {
  if (!baseLayer) return svgText;
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  for (const child of [...doc.documentElement.children]) {
    if (child.tagName === 'g' && child.id && child.id !== baseLayer && child.getAttribute('data-keep-with-group') !== baseLayer) {
      child.remove();
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

function useMapImage(projection: MapProjection): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projection.svgPath) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(projection.svgPath)
      .then((res) => {
        if (!res.ok) throw new Error(`Map image request failed (${res.status})`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([keepBaseLayer(text, projection.svgLayer)], { type: 'image/svg+xml' }));
        setUrl(objectUrl);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projection.svgPath, projection.svgLayer]);

  return url;
}

type MapViewProps = {
  projection: MapProjection;
  markers: MapMarker[];
  path: Point[];
};

export default function MapView({ projection, markers, path }: MapViewProps) {
  const imageUrl = useMapImage(projection);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const home = useMemo<ViewBox>(() => {
    const box = projectBounds(projection.bounds, projection);
    const pad = Math.max(box.width, box.height) * 0.04;
    return { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
  }, [projection]);
  const imageBox = useMemo(() => projectBounds(projection.svgBounds ?? projection.bounds, projection), [projection]);

  const [view, setView] = useState<ViewBox>(home);

  const zoom = useCallback(
    (factor: number, center?: Point) =>
      setView((v) => {
        const width = Math.min(home.width * MAX_ZOOM, Math.max(home.width * MIN_ZOOM, v.width * factor));
        const scale = width / v.width;
        const cx = center?.x ?? v.x + v.width / 2;
        const cy = center?.y ?? v.y + v.height / 2;
        return { x: cx - (cx - v.x) * scale, y: cy - (cy - v.y) * scale, width, height: v.height * scale };
      }),
    [home],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onWheel(event: WheelEvent) {
      const matrix = svg!.getScreenCTM();
      if (!matrix) return;
      event.preventDefault();
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      zoom(event.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP, { x: point.x, y: point.y });
    }
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [zoom]);

  function unitsPerPixel() {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? Math.max(view.width / rect.width, view.height / rect.height) : 1;
  }

  function pan(dx: number, dy: number) {
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  const r = view.width / 110;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        tabIndex={0}
        aria-label="Interactive map. Drag or use the arrow keys to pan, scroll or press plus and minus to zoom."
        className="block aspect-square max-h-[75vh] w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const current = drag.current;
          if (!current || current.pointerId !== e.pointerId) return;
          const scale = unitsPerPixel();
          pan(-(e.clientX - current.x) * scale, -(e.clientY - current.y) * scale);
          drag.current = { ...current, x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          const step = view.width * 0.1;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
          };
          if (moves[e.key]) pan(...moves[e.key]);
          else if (e.key === '+' || e.key === '=') zoom(1 / ZOOM_STEP);
          else if (e.key === '-') zoom(ZOOM_STEP);
          else return;
          e.preventDefault();
        }}
      >
        {imageUrl && (
          <image
            href={imageUrl}
            x={imageBox.x}
            y={imageBox.y}
            width={imageBox.width}
            height={imageBox.height}
            preserveAspectRatio="xMidYMid meet"
          />
        )}
        {path.length > 1 && (
          <polyline
            points={path.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--warning)"
            strokeWidth={r * 0.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${r} ${r * 0.6}`}
          />
        )}
        {markers.map((marker) => (
          <g key={marker.id} transform={`translate(${marker.point.x} ${marker.point.y})`}>
            <title>{marker.label}</title>
            {marker.kind === 'extract' ? (
              <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.3} fill={markerFill.extract} stroke="var(--bg)" strokeWidth={r * 0.25} />
            ) : (
              <circle r={marker.step ? r * 1.3 : r} fill={markerFill[marker.kind]} stroke="var(--bg)" strokeWidth={r * 0.25} />
            )}
            {marker.step !== undefined && (
              <text textAnchor="middle" dominantBaseline="central" fontSize={r * 1.3} fontWeight={700} fill="var(--on-accent)">
                {marker.step}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <Button size="sm" aria-label="Zoom in" onClick={() => zoom(1 / ZOOM_STEP)}>
          +
        </Button>
        <Button size="sm" aria-label="Zoom out" onClick={() => zoom(ZOOM_STEP)}>
          −
        </Button>
        <Button size="sm" onClick={() => setView(home)}>
          Reset
        </Button>
      </div>

      {!projection.svgPath && (
        <p className="absolute bottom-3 left-3 rounded-md bg-surface px-2 py-1 text-xs text-muted">
          No map image for this location, markers only
        </p>
      )}
    </div>
  );
}
