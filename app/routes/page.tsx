import Link from "next/link";
import { ROUTES } from "./routes-data";

export default function RoutesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">🛣️ Progression Routes</h1>
      <p className="mt-2 text-zinc-600">
        Curated quest paths for the big end-game goals. Pick a route below to
        see the order you should be tackling quests in.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ROUTES.map((route) => (
          <Link
            key={route.slug}
            href={`/routes/${route.slug}`}
            className="rounded-md border border-zinc-200 p-5 hover:border-amber-500 hover:bg-amber-50"
          >
            <h2 className="font-semibold">{route.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{route.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
