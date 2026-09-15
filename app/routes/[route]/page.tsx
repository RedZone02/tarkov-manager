import { notFound } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "../routes-data";

export default async function RouteDetailPage(
  props: PageProps<"/routes/[route]">
) {
  const { route: slug } = await props.params;
  const route = ROUTES.find((r) => r.slug === slug);

  if (!route) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/routes" className="text-sm text-amber-600 hover:underline">
        ← Back to routes
      </Link>

      <h1 className="mt-3 text-3xl font-bold">{route.title}</h1>
      <p className="mt-2 text-zinc-600">{route.description}</p>

      <div className="mt-6 rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        Step-by-step quest order for this route hasn&apos;t been added yet.
        Check back soon!
      </div>
    </main>
  );
}
