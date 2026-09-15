"use client";

import { useState } from "react";

type Reminder = {
  id: number;
  station: string;
  materials: string;
};

export default function HideoutPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [station, setStation] = useState("");
  const [materials, setMaterials] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!station.trim()) return;

    setReminders((prev) => [
      ...prev,
      { id: Date.now(), station: station.trim(), materials: materials.trim() },
    ]);
    setStation("");
    setMaterials("");
  }

  function removeReminder(id: number) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">🏠 Hideout Planner</h1>
      <p className="mt-2 text-zinc-600">
        Jot down which hideout upgrade you&apos;re saving up for and what
        materials it needs, so you don&apos;t forget mid-wipe.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 sm:flex-row"
      >
        <input
          type="text"
          placeholder="Station (e.g. Workbench lvl 2)"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Materials needed (optional)"
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Add Reminder
        </button>
      </form>

      <ul className="mt-6 flex flex-col gap-2">
        {reminders.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-3 rounded-md border border-zinc-200 px-4 py-3"
          >
            <div>
              <p className="font-medium text-zinc-800">{r.station}</p>
              {r.materials && (
                <p className="text-sm text-zinc-500">{r.materials}</p>
              )}
            </div>
            <button
              onClick={() => removeReminder(r.id)}
              className="text-xs text-zinc-400 hover:text-red-600"
            >
              remove
            </button>
          </li>
        ))}
      </ul>

      {reminders.length === 0 && (
        <p className="mt-6 rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No upgrade reminders yet. Add one above so you don&apos;t forget!
        </p>
      )}
    </main>
  );
}
