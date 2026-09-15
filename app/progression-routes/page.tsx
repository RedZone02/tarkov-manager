import type { Metadata } from "next";
import { getFeature } from "@/lib/features";
import { collectChain } from "@/lib/quests";
import { getGameMode } from "@/lib/tarkov/mode";
import { getTasks } from "@/lib/tarkov/tasks";
import { getTraders } from "@/lib/tarkov/traders";
import { Page } from "../components/ui/Page";
import { PageHeader } from "../components/ui/PageHeader";
import RoutesClient, { type ProgressionRoute } from "./RoutesClient";

const feature = getFeature("/progression-routes");

export const metadata: Metadata = {
  title: feature.title,
  description: feature.description,
};

export default async function ProgressionRoutesPage() {
  const mode = await getGameMode();
  const [tasks, traders] = await Promise.all([getTasks(mode), getTraders(mode)]);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const collector = tasks.find((task) => task.normalizedName === "collector");
  const smallBusiness3 = tasks.find((task) => task.normalizedName === "small-business-part-3");

  const kappaTargets = [...tasks.filter((task) => task.kappaRequired).map((task) => task.id), ...(collector ? [collector.id] : [])];

  const routes: ProgressionRoute[] = [
    {
      id: "kappa",
      title: "Kappa Container",
      icon: "🧰",
      description: "Collector plus every quest required for Kappa, with all of their prerequisites.",
      taskIds: collectChain(kappaTargets, tasksById).map((task) => task.id),
    },
    {
      id: "unheard",
      title: "Mark of the Unheard",
      icon: "👁️",
      description:
        "Fence's Small Business chain. Part 3 rewards the Mark of The Unheard in PvE; Unheard Edition owners start with it.",
      taskIds: smallBusiness3 ? collectChain([smallBusiness3.id], tasksById).map((task) => task.id) : [],
    },
  ];

  const routeTaskIds = new Set(routes.flatMap((route) => route.taskIds));
  const routeTasks = tasks
    .filter((task) => routeTaskIds.has(task.id))
    .map((task) => ({ ...task, objectives: task.objectives.map((objective) => ({ ...objective, locations: [] })) }));

  return (
    <Page>
      <PageHeader
        icon={feature.icon}
        title={feature.title}
        description="Every quest on the way to a major goal, in the order you can do them. Shares progress with the Quest Tracker."
      />
      <RoutesClient mode={mode} routes={routes} tasks={routeTasks} traders={traders} />
    </Page>
  );
}
