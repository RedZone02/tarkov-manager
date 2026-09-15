import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getMaps } from "@/lib/tarkov/maps";
import { getGameMode } from "@/lib/tarkov/mode";
import { getTasks } from "@/lib/tarkov/tasks";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import RaidMapClient from "./RaidMapClient";

const feature = getFeature("/raid-map");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function RaidMapPage() {
  const mode = await getGameMode();
  const [maps, tasks] = await Promise.all([getMaps(mode), getTasks(mode)]);
  const mapTasks = tasks
    .map((task) => ({ ...task, objectives: task.objectives.filter((objective) => objective.locations.length > 0) }))
    .filter((task) => task.objectives.length > 0);

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="Extracts, bosses and the objectives of your available quests, plus a suggested route through them."
      />
      <RaidMapClient mode={mode} maps={maps} tasks={mapTasks} />
    </Page>
  );
}
