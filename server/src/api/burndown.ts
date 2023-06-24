import { TRPCError } from "@trpc/server";
import { getList } from "./lists";
import { getTasks } from "./tasks";

export async function getBurndown(sprintId: string) {
  const sprint = await getList(sprintId);
  const tasks = await getTasks([], [], [sprintId], [], null);

  if (!sprint.start_date || !sprint.due_date) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The specified folder does not have a specified date range",
    });
  }

  const sortedTasks = tasks.sort(
    (a, b) =>
      (a.due_date ?? sprint.due_date!).getTime() -
      (b.due_date ?? sprint.due_date!).getTime()
  );

  const plannedTime = sortedTasks.reduce(
    (sum, task) => sum + (task.time_estimate ?? 0),
    0
  );

  const plannedCurve: Record<number, number> = {
    [sprint.due_date.getTime()]: plannedTime,
  };

  let accountedTime = 0;
  for (const task of sortedTasks) {
    accountedTime += task.time_estimate ?? 0;

    console.log(task.time_estimate);

    const moment = (task.due_date ?? sprint.due_date).getTime();
    plannedCurve[moment] ??= plannedTime;
    plannedCurve[moment] -= accountedTime;
  }

  //   console.log(JSON.stringify(plannedCurve));

  return {
    start: sprint.start_date,
    end: sprint.due_date,
    plannedCurve,
  };
}
