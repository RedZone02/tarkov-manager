import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getMaps } from "@/lib/tarkov/maps";
import { getGameMode } from "@/lib/tarkov/mode";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import RaidCalculatorClient from "./RaidCalculatorClient";

const feature = getFeature("/raid-calculator");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function RaidCalculatorPage() {
  const mode = await getGameMode();
  const maps = await getMaps(mode).catch(() => []);
  const mapNames = [...new Set(maps.map((map) => map.name))];

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="Price your loadout and loot with live flea and trader prices, then log the result of each raid."
      />
      <RaidCalculatorClient mode={mode} mapNames={mapNames} />
    </Page>
  );
}
