import { z } from "zod";
import { TimeEntrySchema } from "../schemas/time-entry";
import { api } from "./api";
import { getUsers } from "./get-users";

const ResponseSchema = z.object({
  data: z.array(TimeEntrySchema),
});

export async function getAllTimeEntries() {
  const users = await getUsers();
  if (!users) {
    return null;
  }

  const timeEntries = await Promise.all(
    users.members.map(async ({ id }) => getTimeEntriesForUser(id))
  );
  return timeEntries.flatMap((timeEntry) => timeEntry?.data ?? null);
}

export async function getTimeEntriesForUser(userId: number) {
  const params = new URLSearchParams({
    assignee: userId.toString(),
  });

  const teamId = "9003057443";
  return api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${params.toString()}`
  );
}
