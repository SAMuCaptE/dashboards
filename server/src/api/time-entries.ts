import { TimeEntry } from "common";
import { z } from "zod";
import { api } from "./api";
import { database } from "./database";
import { getUsers } from "./users";

const ResponseSchema = z.object({
  data: z.array(TimeEntry),
});

export async function getTimeEntriesInRange(
  start: Date,
  end: Date,
): Promise<Array<TimeEntry>> {
  const timeEntries = await getAllTimeEntries();

  if (!timeEntries) {
    throw new Error("Could not find some time entries.");
  }

  const selectedTimeEntries: Array<TimeEntry> = [];
  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    const moment = new Date(timeEntry.end).getTime();
    if (start.getTime() <= moment && end.getTime() > moment) {
      selectedTimeEntries.push(timeEntry);
    }
  }

  return selectedTimeEntries;
}

export async function getAllTimeEntries() {
  const users = await getUsers();
  if (!users) {
    return null;
  }

  const timeEntries = await Promise.all(
    users.members.map(async ({ id }) => getTimeEntriesForUser(id)),
  );
  return timeEntries.flatMap((timeEntry) => timeEntry?.data ?? null);
}

export async function getTimeEntriesForUser(userId: number) {
  const params = new URLSearchParams({
    start_date: new Date(process.env.HOURS_START_DATE!).getTime().toString(),
    end_date: new Date().getTime().toString(),
    assignee: userId.toString(),
    include_task_tags: "true",
  });

  const teamId = "9003057443";
  return api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${params.toString()}`,
  );
}

export async function addTimeEntry(
  userId: string,
  taskId: string,
  start: Date,
  end?: Date,
) {
  await database(async (connection) => {
    const query = `
    INSERT INTO time_entries (start, end, user_id, task_id)
    VALUES (?, ?, ?, ?)
    `;
    const stmt = await connection.prepare(query);
    await stmt.execute([start, end || null, userId, taskId]);
    await stmt.close();
  });
}

export async function completeTimeEntry(timeEntryId: number, end: Date) {
  await database(async (connection) => {
    const query = `UPDATE time_entries SET end = ? WHERE id = ?`;
    const stmt = await connection.prepare(query);
    await stmt.execute([end, timeEntryId]);
    await stmt.close();
  });
}

export async function getOngoingTimeEntry(userId: string) {
  const rows = await database(async (connection) => {
    const query = `SELECT * FROM time_entries WHERE end IS NULL AND user_id = ?`;
    const stmt = await connection.prepare(query);
    const [rows] = await stmt.execute([userId]);
    await stmt.close();
    return rows;
  });

  const timeEntries = z
    .array(
      z.object({
        id: z.number(),
        start: z.date(),
        user_id: z.coerce.number(),
        task_id: z.string(),
      }),
    )
    .parse(rows);

  if (!timeEntries || timeEntries?.length === 0) {
    return null;
  }

  const timeEntry = timeEntries[0];
  return {
    id: timeEntry.id,
    userId: timeEntry.user_id,
    taskId: timeEntry.task_id,
    start: new Date(timeEntry.start).getTime(),
  };
}
