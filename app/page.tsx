import Link from 'next/link';
import { features } from '@/lib/features';
import { ButtonLink, buttonClasses } from './components/ui/Button';

export default function Home() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted">
            Escape from Tarkov companion
          </p>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Tarkov <span className="text-accent">Manager</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            Your all-in-one companion for Escape from Tarkov. Manage wipe progression more efficiently with quest
            tracking, raid planning and profit analysis in one place.
          </p>
          <p className="text-muted">Spend less time switching between resources and more time focusing on your objectives.</p>
          <div className="flex w-full flex-col justify-center gap-3 pt-2 sm:w-auto sm:flex-row">
            <ButtonLink href="#features" variant="primary">
              Explore features
            </ButtonLink>
            <a
              href="https://github.com/RedZone02/tarkov-manager"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses('secondary')}
            >
              GitHub repository
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight">✨ Features</h2>
        <p className="mt-2 text-muted">Everything you need to plan and optimize your wipe.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent"
            >
              <span aria-hidden className="text-4xl transition-transform group-hover:scale-110">
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold transition-colors group-hover:text-accent">{feature.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{feature.description}</p>
              <span className="mt-4 text-sm font-medium text-accent">
                Open{' '}
                <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">🎯 Project goal</h2>
            <p className="mt-3 text-muted">
              Escape from Tarkov often requires players to switch between multiple websites for quests, maps,
              ballistics, hideout planning and progression tracking. Tarkov Manager eliminates that friction by
              combining the most commonly used Tarkov utilities into one cohesive web application.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">🚀 Vision</h2>
            <p className="mt-3 text-muted">
              Tarkov Manager is designed to become an all-in-one companion for every stage of a Tarkov wipe, continuously
              expanding its toolkit with features that improve planning, efficiency and decision-making.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
