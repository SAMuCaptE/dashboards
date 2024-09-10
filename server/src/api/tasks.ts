import { Task } from "common";
import { z } from "zod";
import { api } from "./api";
import { database } from "./database";
import { getTimeSpent } from "./time-entries";

const ResponseSchema = z.object({
  tasks: z.array(Task),
});

const teamId = "9003057443";

export async function getTasks(
  tags: string[],
  assigneeIds: string[],
  listIds: string[],
  spaceIds: string[],
  epicId: string | null,
) {
  let query = new URLSearchParams({
    archived: "false",
    page: "0",
    order_by: "updated",
    reverse: "true",
    subtasks: "true",
    include_closed: "true",
  }).toString();

  if (tags && tags.length > 0) {
    query += "&" + tags.map((tag) => `tags[]=${tag}`).join("&");
  }
  if (assigneeIds && assigneeIds.length > 0) {
    query += "&" + assigneeIds.map((tag) => `assignees[]=${tag}`).join("&");
  }
  if (listIds && listIds.length > 0) {
    query += "&" + listIds.map((tag) => `list_ids[]=${tag}`).join("&");
  }
  if (spaceIds && spaceIds.length > 0) {
    query += "&" + spaceIds.map((tag) => `space_ids[]=${tag}`).join("&");
  }

  if (epicId) {
    const filter = {
      field_id: "9ea77eb9-0a2b-4130-b94d-8fa80f68f048",
      operator: "ANY",
      value: [epicId],
    };
    query += `&custom_fields=[${JSON.stringify(filter)}]`;
  }

  const data = await api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/team/${teamId}/task?${query}`,
  );

  if (!data?.tasks) {
    throw new Error("Could not find any tasks");
  }

  const taskIds = data.tasks.map((task) => task.id);
  const timeSpent = await getTimeSpent(taskIds);

  timeSpent.forEach(({ taskId, timeSpent }) => {
    const t = data.tasks.find((t) => t.id === taskId)!;
    t.time_spent ??= 0;
    t.time_spent += timeSpent;
  });

  return data.tasks;
}

export async function getTask(taskId: string) {
  const query = new URLSearchParams({
    team_id: teamId,
    custom_task_ids: "true",
    include_subtasks: "true",
    include_markdown_description: "true",
    custom_fields: "string",
  }).toString();

  const task = await api(Task).get(
    `https://api.clickup.com/api/v2/task/${taskId}?${query}`,
  );
  if (task) {
    await syncTasks([task]);
  }
  return task;
}

export async function getKnownTasks(taskIds: string[]) {
  return database(async (connection) => {
    const stmt = await connection.prepare(
      `select id, name from tasks where id in (${Array(taskIds.length).fill("?").join(",")})`,
    );
    const [rows] = await stmt.execute(taskIds);
    return z.array(z.object({ id: z.string(), name: z.string() })).parse(rows);
  });
}

export async function syncTasks(tasks: Task[]) {
  for (const task of tasks) {
    const location = {
      list_id: task.list.id,
      folder_id: task.folder.id,
      space_id: task.space.id,
    };

    await database(async (connection) => {
      const stmt = await connection.prepare(
        `replace into tasks (id, name, location, tags) values (?, ?, ?, ?)`,
      );
      await stmt.execute([
        task.id,
        task.name,
        JSON.stringify(location),
        JSON.stringify(task.tags),
      ]);
      await stmt.close();
    });
  }
}
