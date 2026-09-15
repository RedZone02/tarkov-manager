import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getWeaponBuilds } from "@/lib/tarkov/builds";
import { getGameMode } from "@/lib/tarkov/mode";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import BuildsClient from "./BuildsClient";

const feature = getFeature("/weapon-builds");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function WeaponBuildsPage() {
  const mode = await getGameMode();
  const builds = await getWeaponBuilds(mode);

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="The game's named weapon builds with full part lists, live prices and how they compare to the stock gun."
      />
      <BuildsClient builds={builds} />
    </Page>
  );
}
