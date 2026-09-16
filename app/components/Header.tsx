'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { features } from '@/lib/features';
import AccountMenu from './AccountMenu';
import ModeSwitch from './ModeSwitch';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Home', icon: '🎯' },
  ...features.map((f) => ({ href: f.href, label: f.navLabel, icon: f.icon })),
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const isMenuOpen = menuPath === pathname;

  return (
    <header
      className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setMenuPath(null);
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold">
          <span aria-hidden>🎯</span>
          <span>
            Tarkov <span className="text-accent">Manager</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-surface-2 text-text' : 'text-muted hover:text-text',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <ModeSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          <AccountMenu />
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text xl:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuPath(isMenuOpen ? null : pathname)}
          >
            <svg aria-hidden className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-border xl:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <ModeSwitch className="mb-3 sm:hidden" />
            <ul className="grid gap-1 sm:grid-cols-2">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuPath(null)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors',
                        active ? 'bg-surface-2 text-text' : 'text-muted hover:bg-surface-2 hover:text-text',
                      )}
                    >
                      <span aria-hidden>{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
}
