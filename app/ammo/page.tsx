const TIERS = ["S", "A", "B", "C", "D", "F"];

export default function AmmoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">🔫 Ammo Tier List</h1>
      <p className="mt-2 text-zinc-600">
        A quick reference for how ammo stacks up by penetration and damage.
        We&apos;re still putting the rankings together, so the shelves below
        are empty for now.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {TIERS.map((tier) => (
          <div
            key={tier}
            className="flex items-stretch overflow-hidden rounded-md border border-zinc-200"
          >
            <div className="flex w-14 shrink-0 items-center justify-center bg-zinc-800 text-lg font-bold text-white">
              {tier}
            </div>
            <div className="flex flex-1 items-center px-4 py-4 text-sm text-zinc-400">
              No ammo ranked yet
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
