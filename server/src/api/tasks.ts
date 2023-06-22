import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TaskSchema } from "../schemas/task";
import { api } from "./api";

const ResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export async function getTasks(
  tags: string[],
  assigneeIds: string[],
  listIds: string[]
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

  const teamId = "9003057443";
  const data = await api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/team/${teamId}/task?${query}`
  );

  if (!data?.tasks) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find any tasks",
    });
  }

  return data.tasks;
}
