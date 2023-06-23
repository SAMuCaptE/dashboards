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
  listIds: string[],
  spaceIds: string[],
  epicId: string | null
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
