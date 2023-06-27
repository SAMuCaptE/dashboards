import { TRPCError } from "@trpc/server";
import { List } from "../schemas/list";
import { getList } from "./lists";
import { getTasks } from "./tasks";

type Curve = Record<number, number>;

export async function getBurndown(sprintId: string) {
  const sprint = await getList(sprintId);
  const tasks = await getTasks([], [], [sprintId], [], null);

  if (!sprint.start_date || !sprint.due_date) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The specified folder does not have a specified date range",
    });
  }

  const plannedTime = tasks.reduce(
    (sum, task) => sum + (task.time_estimate ?? 0),
    0
  );

  const sortedTasksByDueDate = tasks.sort(
    (a, b) =>
      (a.due_date ?? sprint.due_date!).getTime() -
      (b.due_date ?? sprint.due_date!).getTime()
  );

  const sortedTasksByCompletedDate = tasks
    .filter((task) => ["closed", "complete"].includes(task.status.status))
    .sort(
      (a, b) =>
        (a.date_done ?? a.date_closed)!.getTime() -
        (b.date_done ?? b.date_closed)!.getTime()
    );

  const idealCurve: Curve = {
    [sprint.start_date.getTime()]: plannedTime,
    [clampDateToSprint(sprint.due_date, sprint).getTime()]: 0,
  };

  const plannedCurve: Curve = {
    [sprint.start_date.getTime()]: plannedTime,
  };

  const actualCurve: Curve = {
    [sprint.start_date.getTime()]: plannedTime,
  };

  let accountedTime = 0;
  for (const task of sortedTasksByDueDate) {
    accountedTime += task.time_estimate ?? 0;
    const moment = clampDateToSprint(task.due_date, sprint).getTime();
    plannedCurve[moment] = plannedTime - accountedTime;
  }

  let completedTime = 0;
  for (const task of sortedTasksByCompletedDate) {
    completedTime += task.time_estimate ?? 0;
    const moment = clampDateToSprint(
      task.date_done ?? task.date_closed,
      sprint
    ).getTime();
    actualCurve[moment] = plannedTime - completedTime;
  }
  actualCurve[clampDateToSprint(sprint.due_date, sprint).getTime()] =
    plannedTime - completedTime;

  return {
    start: sprint.start_date,
    end: sprint.due_date,
    plannedCurve,
    actualCurve,
    idealCurve,
  };
}

function clampDateToSprint(toClamp: Date | null, sprint: List) {
  let clampedDate = toClamp;

  if (toClamp === null || toClamp.getTime() > sprint.due_date!.getTime()) {
    clampedDate = new Date(sprint.due_date!.getTime());
  } else if (toClamp.getTime() < sprint.start_date!.getTime()) {
    const sprintStart = new Date(sprint.start_date!.getTime());
    sprintStart.setDate(sprintStart.getDate() + 1);
    clampedDate = sprintStart;
  }

  clampedDate!.setHours(0);
  clampedDate!.setMinutes(0);
  clampedDate!.setSeconds(0);
  clampedDate!.setMilliseconds(0);

  return clampedDate!;
}
