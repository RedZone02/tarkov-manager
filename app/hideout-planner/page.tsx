import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getHideout } from "@/lib/tarkov/hideout";
import { getGameMode } from "@/lib/tarkov/mode";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import HideoutClient from "./HideoutClient";

const feature = getFeature("/hideout-planner");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function HideoutPlannerPage() {
  const mode = await getGameMode();
  const stations = await getHideout(mode);

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="Set the level of each station to see which upgrades are ready, what they still need and what everything costs."
      />
      <HideoutClient mode={mode} stations={stations} />
    </Page>
  );
}
