import { Epic } from "common";
import { getEpicList } from "./lists";
import { getTasks } from "./tasks";

export async function getEpics(sessionTag: string, sprintId: string | null) {
  const epicSpaceId = "90110010916";
  const epicTasks = await getTasks([sessionTag], [], [], [epicSpaceId], null);

  const listIds = sprintId ? [sprintId] : [];
  const promises = epicTasks.map(async (epic) => {
    const associatedTasks = await getTasks([], [], listIds, [], epic.id);
    return { epic, associatedTasks };
  });
  const allTasks = await Promise.all(promises);
  const epicLists = await Promise.all(
    allTasks.map((task) => getEpicList(task.epic.list.id)),
  );

  const result: Array<Epic> = [];
  for (const { epic, associatedTasks } of allTasks) {
    if (epic.tags.some((t: any) => t.name === "no-show")) {
      continue;
    }

    const completedTasks = associatedTasks.filter((task) =>
      ["done", "closed", "complete", "cancelled"].includes(task.status.status),
    );

    const totalPlannedInMs = associatedTasks.reduce(
      (sum, task) => sum + (task.time_estimate ?? 0),
      0,
    );
    const totalSpentInMs = associatedTasks.reduce(
      (sum, task) => sum + (task.time_spent ?? 0),
      0,
    );

    result.push({
      ...epic,
      domain: epicLists.find((e) => e.id === epic.list.id)?.name ?? "unknown",
      ticketCount: associatedTasks.length,
      completedTicketCount: completedTasks.length,
      totalTimePlanned: totalPlannedInMs,
      totalTimeSpent: totalSpentInMs,
    });
  }

  return result;
}
