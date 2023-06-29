import { z } from "zod";
import { TaskSchema } from "../schemas/task";
import { getTasks } from "./tasks";

type Epic = z.infer<typeof TaskSchema>;

export async function getEpics(sessionTag: string, sprintId: string | null) {
  const epicSpaceId = "90110010916";
  const epicTasks = await getTasks([sessionTag], [], [], [epicSpaceId], null);

  const listIds = sprintId ? [sprintId] : [];
  const promises = epicTasks.map(async (epic) => {
    const associatedTasks = await getTasks([], [], listIds, [], epic.id);
    return { epic, associatedTasks };
  });
  const allTasks = await Promise.all(promises);

  const result: Array<
    Epic & {
      ticketCount: number;
      completedTicketCount: number;
      totalTimePlanned: number;
      totalTimeSpent: number;
    }
  > = [];

  for (const { epic, associatedTasks } of allTasks) {
    const completedTasks = associatedTasks.filter((task) =>
      ["closed", "complete"].includes(task.status.status)
    );

    const totalPlannedInMs = associatedTasks.reduce(
      (sum, task) => sum + (task.time_estimate ?? 0),
      0
    );
    const totalSpentInMs = associatedTasks.reduce(
      (sum, task) => sum + (task.time_spent ?? 0),
      0
    );

    result.push({
      ...epic,
      ticketCount: associatedTasks.length,
      completedTicketCount: completedTasks.length,
      totalTimePlanned: totalPlannedInMs,
      totalTimeSpent: totalSpentInMs,
    });
  }

  return result;
}
