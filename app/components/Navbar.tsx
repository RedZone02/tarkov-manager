"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/map", label: "Raid Map" },
  { href: "/quests", label: "Quest Tracker" },
  { href: "/routes", label: "Routes" },
  { href: "/calculator", label: "Calculator" },
  { href: "/hideout", label: "Hideout" },
  { href: "/ammo", label: "Ammo" },
  { href: "/builds", label: "Builds" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-zinc-900 text-zinc-100">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link href="/" className="text-lg font-bold whitespace-nowrap">
          🎯 Tarkov Manager
        </Link>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "font-semibold text-amber-400"
                    : "text-zinc-300 hover:text-amber-400"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
