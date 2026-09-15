const CATEGORIES = ["Assault Rifle", "SMG", "Sniper", "Shotgun", "Pistol"];

export default function BuildsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">🔧 Weapon Meta Builds</h1>
      <p className="mt-2 text-zinc-600">
        Browse popular builds before sinking your roubles into attachments.
        This section is still under construction.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600"
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-32 items-center justify-center rounded-md border border-dashed border-zinc-300 text-sm text-zinc-400"
          >
            Build coming soon
          </div>
        ))}
      </div>
    </main>
  );
}
