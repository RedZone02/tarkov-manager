const linkClass = 'font-medium text-text underline-offset-4 hover:text-accent hover:underline';

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>
          Tarkov Manager: a companion app for Escape from Tarkov players ·{' '}
          <a href="https://github.com/RedZone02/tarkov-manager" target="_blank" rel="noopener noreferrer" className={linkClass}>
            GitHub
          </a>
        </p>
        <p>
          Game data from{' '}
          <a href="https://tarkov.dev" target="_blank" rel="noopener noreferrer" className={linkClass}>
            tarkov.dev
          </a>
          . Not affiliated with Battlestate Games.
        </p>
      </div>
    </footer>
  );
}
