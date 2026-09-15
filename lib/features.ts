export type Feature = {
  href: `/${string}`;
  title: string;
  navLabel: string;
  icon: string;
  description: string;
};

export const features: Feature[] = [
  {
    href: '/raid-map',
    title: 'Interactive Raid Map',
    navLabel: 'Raid Map',
    icon: '🗺️',
    description:
      'Explore maps with extracts, boss spawns and quest objectives, and generate a route through your active quests.',
  },
  {
    href: '/quest-tracker',
    title: 'Quest Tracker',
    navLabel: 'Quests',
    icon: '📋',
    description:
      'Track completed and active quests and monitor progression across every trader throughout your wipe.',
  },
  {
    href: '/progression-routes',
    title: 'Progression Routes',
    navLabel: 'Routes',
    icon: '🛣️',
    description:
      'Follow the full quest chains for the Kappa Container and Mark of the Unheard, in dependency order.',
  },
  {
    href: '/raid-calculator',
    title: 'Raid Calculator',
    navLabel: 'Calculator',
    icon: '💰',
    description:
      'Compare gear and consumable cost against extracted loot value to see the profit or loss of every raid.',
  },
  {
    href: '/hideout-planner',
    title: 'Hideout Planner',
    navLabel: 'Hideout',
    icon: '🏠',
    description:
      'See which hideout upgrades are ready, what they still need and the total cost of your shopping list.',
  },
  {
    href: '/ammo-tier-list',
    title: 'Ammo Tier List',
    navLabel: 'Ammo',
    icon: '🔫',
    description:
      'Compare every round by penetration, damage and price to pick the right ammo before each raid.',
  },
  {
    href: '/weapon-builds',
    title: 'Weapon Meta Builds',
    navLabel: 'Builds',
    icon: '🔧',
    description:
      'Browse curated weapon builds with full attachment lists and live cost breakdowns.',
  },
];

export function getFeature(href: Feature['href']): Feature {
  const feature = features.find((f) => f.href === href);
  if (!feature) throw new Error(`Unknown feature: ${href}`);
  return feature;
}
