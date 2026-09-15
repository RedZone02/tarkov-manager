import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getAmmo } from "@/lib/tarkov/ammo";
import { getGameMode } from "@/lib/tarkov/mode";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import AmmoClient from "./AmmoClient";

const feature = getFeature("/ammo-tier-list");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function AmmoTierListPage() {
  const mode = await getGameMode();
  const ammo = await getAmmo(mode);

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="Every round's ballistics and price, ranked by how well it gets through armor."
      />
      <AmmoClient ammo={ammo} />
    </Page>
  );
}
