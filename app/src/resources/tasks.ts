import { createResource, Resource } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";

type Defined<T> = Exclude<T, undefined>;

type Problem = { description: string; taskId: string };
type Task = Defined<
  Awaited<ReturnType<(typeof client)["tasks"]["query"]>>
>[number];
export type TaskWithProblem = Task & {
  problems: Problem[];
};

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

export function useTasks(sprintId: Resource<string>) {
  return createResource(sprintId, async (id) => {
    if (!id) {
      return { tasks: [], subtasks: {} };
    }

    const tasks = await client.tasks
      .query({
        listIds: [id],
        dueDate,
        session,
      })
      .catch(() => []);

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

    return { tasks: topLevelTasks, subtasks };
  });
}
