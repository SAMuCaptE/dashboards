import { TaskWithProblem } from "common";
import { createResource, Resource } from "solid-js";
import { z } from "zod";

import { makeRequest } from "../client";
import { dueDate, session } from "../stores/params";

const statusOrder = {
  open: 0,
  "to do": 1,
  "in progress": 2,
  review: 3,
  complete: 4,
  shipping: 5,
  blocked: 6,
  closed: 6,
  cancelled: 7,
};

export function useTasks(sprintId: Resource<string | null>) {
  return createResource(sprintId, async (id) => {
    if (!id) {
      return {
        tasks: [] as TaskWithProblem[],
        subtasks: {} as Record<string, TaskWithProblem[]>,
        timeTotals: { actual: 0, planned: 0 },
      };
    }

    const tasks = await makeRequest(`/tasks`)
      .get(
        z.array(TaskWithProblem),
        new URLSearchParams({
          session,
          dueDate,
          listId: id,
        }),
      )
      .catch(() => [] as TaskWithProblem[]);

    const parentTasks = tasks.filter((task) => task.parent === null);

    const subtasks = (() => {
      const counts: Record<string, TaskWithProblem[]> = {};
      for (const task of tasks) {
        if (task.parent !== null) {
          counts[task.parent] ??= [];
          counts[task.parent].push(task);
        }
      }
      return counts;
    })();

    const topLevelTasks = parentTasks.sort((a, b) =>
      statusOrder[a.status.status] > statusOrder[b.status.status] ? 1 : -1,
    );

    for (const key of Object.keys(subtasks)) {
      subtasks[key] = subtasks[key].sort((a, b) =>
        statusOrder[a.status.status] > statusOrder[b.status.status] ? 1 : -1,
      );
    }

    const timeTotals = tasks.reduce(
      (sum, current) => {
        sum.planned += current.time_estimate ?? 0;
        sum.actual += current.time_spent ?? 0;
        return sum;
      },
      { planned: 0, actual: 0 },
    );

    return { tasks: topLevelTasks, subtasks, timeTotals };
  });
}
