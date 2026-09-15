"use client";

import { useState } from "react";

type Quest = {
  id: number;
  name: string;
  trader: string;
  done: boolean;
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [name, setName] = useState("");
  const [trader, setTrader] = useState("");

  function handleAddQuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const newQuest: Quest = {
      id: Date.now(),
      name: name.trim(),
      trader: trader.trim() || "Unknown",
      done: false,
    };

    setQuests((prev) => [...prev, newQuest]);
    setName("");
    setTrader("");
  }

  function toggleDone(id: number) {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, done: !q.done } : q))
    );
  }

  function removeQuest(id: number) {
    setQuests((prev) => prev.filter((q) => q.id !== id));
  }

  const completedCount = quests.filter((q) => q.done).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">📋 Quest Tracker</h1>
      <p className="mt-2 text-zinc-600">
        Keep tabs on which quests you&apos;ve got going this wipe. Add a quest
        below and check it off once it&apos;s turned in.
      </p>

      <form
        onSubmit={handleAddQuest}
        className="mt-6 flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 sm:flex-row"
      >
        <input
          type="text"
          placeholder="Quest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Trader (optional)"
          value={trader}
          onChange={(e) => setTrader(e.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm sm:w-40"
        />
        <button
          type="submit"
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Add Quest
        </button>
      </form>

      {quests.length > 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          {completedCount} of {quests.length} completed
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {quests.map((q) => (
          <li
            key={q.id}
            className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-4 py-3"
          >
            <label className="flex flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={q.done}
                onChange={() => toggleDone(q.id)}
                className="h-4 w-4"
              />
              <span
                className={
                  q.done ? "text-zinc-400 line-through" : "text-zinc-800"
                }
              >
                {q.name} <span className="text-xs text-zinc-400">({q.trader})</span>
              </span>
            </label>
            <button
              onClick={() => removeQuest(q.id)}
              className="text-xs text-zinc-400 hover:text-red-600"
            >
              remove
            </button>
          </li>
        ))}
      </ul>

      {quests.length === 0 && (
        <p className="mt-6 rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No quests yet. Add one above to get started!
        </p>
      )}
    </main>
  );
}
