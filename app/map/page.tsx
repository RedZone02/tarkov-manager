"use client";

import { useState } from "react";

const MAPS = [
  "Customs",
  "Woods",
  "Shoreline",
  "Interchange",
  "Reserve",
  "Factory",
  "Lighthouse",
  "Streets of Tarkov",
  "Ground Zero",
];

export default function MapPage() {
  const [selectedMap, setSelectedMap] = useState(MAPS[0]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">🗺️ Interactive Raid Map</h1>
      <p className="mt-2 text-zinc-600">
        Pick a map to see extract points and quest markers. The actual map
        view is still being built — for now this is just the layout.
      </p>

      <select
        value={selectedMap}
        onChange={(e) => setSelectedMap(e.target.value)}
        className="mt-6 rounded border border-zinc-300 px-3 py-2 text-sm"
      >
        {MAPS.map((map) => (
          <option key={map} value={map}>
            {map}
          </option>
        ))}
      </select>

      <div className="mt-4 flex h-96 items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400">
        {selectedMap} map view coming soon
      </div>
    </main>
  );
}
