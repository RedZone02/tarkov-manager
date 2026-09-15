import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { getMapNames } from "@/lib/tarkov/maps";
import { getGameMode } from "@/lib/tarkov/mode";
import { getTasks } from "@/lib/tarkov/tasks";
import { getTraders } from "@/lib/tarkov/traders";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import QuestClient from "./QuestClient";

const feature = getFeature("/quest-tracker");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function QuestTrackerPage() {
  const mode = await getGameMode();
  const [tasks, traders, mapNames] = await Promise.all([getTasks(mode), getTraders(mode), getMapNames(mode)]);
  const trackerTasks = tasks.map((task) => ({
    ...task,
    objectives: task.objectives.map((objective) => ({ ...objective, locations: [] })),
  }));

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description={`Track quest progress for every trader. Progress is saved in this browser, separately for ${mode === "pve" ? "PvE" : "PvP"}.`}
      />
      <QuestClient mode={mode} tasks={trackerTasks} traders={traders} mapNames={mapNames} />
    </Page>
  );
}
