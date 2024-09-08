import { TimeEntry, User } from "common";
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
    users.members.map(getTimeEntriesForUser),
  );
  return timeEntries.flat();
}

export async function getTimeEntriesForUser(user: User) {
  const start = new Date(process.env.HOURS_START_DATE!);
  const end = new Date();

  const params = new URLSearchParams({
    start_date: start.getTime().toString(),
    end_date: end.getTime().toString(),
    assignee: user.id.toString(),
    include_task_tags: "true",
  });

  const teamId = "9003057443";
  const timeEntries = await Promise.all([
    getManualTimeEntries(user, start, end),
    api(ResponseSchema)
      .get(
        `https://api.clickup.com/api/v2/team/${teamId}/time_entries?${params.toString()}`,
      )
      .then((response) => response?.data ?? []),
  ]);
  return timeEntries.flat();
}

export async function addTimeEntry(
  userId: string,
  taskId: string,
  start: Date,
  end?: Date,
): Promise<TimeEntry> {
  if (end && end.getTime() < start.getTime()) {
    throw new Error("start date is after end date");
  }

  const user = (await getUsers()).members.find(
    (user) => user.id.toString() === userId,
  );
  if (!user) {
    throw new Error("could not find user with id=" + userId);
  }

  const rows = await database(async (connection) => {
    const stmt = await connection.prepare(`
    INSERT INTO time_entries (start, end, user_id, task_id)
    VALUES (?, ?, ?, ?)
    `);
    await stmt.execute([start, end || null, userId, taskId]);
    await stmt.close();

    const select = await connection.prepare(`
    SELECT time_entries.*, t.name, t.location, t.tags
    FROM time_entries 
    LEFT JOIN tasks t ON time_entries.task_id = t.id 
    WHERE end IS NOT NULL AND user_id = ?
    ORDER BY id DESC
    LIMIT 1
    `);
    const [rows] = await select.execute([userId]);
    await select.close();
    return rows;
  });

  return parseTimeEntries(user, rows)[0];
}

export async function completeTimeEntry(
  userId: string,
  timeEntryId: number,
  end: Date,
): Promise<TimeEntry> {
  const user = (await getUsers()).members.find(
    (user) => user.id.toString() === userId,
  );
  if (!user) {
    throw new Error("could not find user with id=" + userId);
  }

  const rows = await database(async (connection) => {
    const stmt = await connection.prepare(
      `UPDATE time_entries SET end = ? WHERE id = ?`,
    );
    await stmt.execute([end, timeEntryId]);
    await stmt.close();

    const select = await connection.prepare(`
    SELECT time_entries.*, t.name, t.location, t.tags
    FROM time_entries 
    LEFT JOIN tasks t ON time_entries.task_id = t.id 
    WHERE end IS NOT NULL AND user_id = ?
    ORDER BY id DESC
    LIMIT 1
    `);
    const [rows] = await select.execute([userId]);
    await select.close();
    return rows;
  });

  return parseTimeEntries(user, rows)[0];
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
    start: timeEntry.start,
  };
}

async function getManualTimeEntries(
  user: User,
  minDate: Date,
  maxDate: Date,
): Promise<TimeEntry[]> {
  const rows = await database(async (connection) => {
    const query = `
    SELECT time_entries.*, t.name, t.location, t.tags
    FROM time_entries 
    LEFT JOIN tasks t ON time_entries.task_id = t.id 
    WHERE end IS NOT NULL AND user_id = ? AND start >= ? AND end <= ?
        `;
    const stmt = await connection.prepare(query);
    const [rows] = await stmt.execute([user.id, minDate, maxDate]);
    await stmt.close();
    return rows;
  });
  return parseTimeEntries(user, rows);
}

function parseTimeEntries(user: User, rows: any) {
  const timeEntries = z
    .array(
      z.object({
        id: z.number(),
        start: z.date(),
        end: z.date(),
        user_id: z.coerce.number(),
        task_id: z.string(),
        name: z.string().nullable(),
        tags: z.string().nullable(),
        location: z.string().nullable(),
      }),
    )
    .parse(rows);

  return timeEntries?.length
    ? timeEntries.map((timeEntry) => makeTimeEntry(user, timeEntry))
    : [];
}

function makeTimeEntry(
  user: User,
  timeEntry: {
    id: number;
    task_id: string;
    start: Date;
    end: Date;
    name: string | null;
    tags: string | null;
    location: string | null;
  },
): TimeEntry {
  const start = new Date(timeEntry.start).getTime();
  const end = new Date(timeEntry.end).getTime();
  return {
    user,
    id: timeEntry.id.toString(),
    start,
    end,
    duration: Math.abs(end - start),
    task: {
      id: timeEntry.task_id,
      name: timeEntry.name ?? "tache inconnue",
      status: {
        type: "",
        orderindex: 0,
        status: "open",
        color: "#000000",
      },
    },
    task_tags: JSON.parse(timeEntry.tags ?? "[]"),
    task_location: JSON.parse(
      timeEntry.location ?? '{"list_id": "", "folder_id": "", "space_id": ""}',
    ),
    task_url: `https://app.clickup.com/t/${timeEntry.task_id}`,

    wid: "",
    billable: false,
    description: "",
    tags: [],
    source: "manual",
    at: new Date().getTime(),
  };
}

export async function getTimeSpent(
  taskIds: string[],
): Promise<{ taskId: string; timeSpent: number }[]> {
  if (!taskIds.length) {
    return [];
  }

  const records = await database(async (connection) => {
    const stmt = await connection.prepare(
      `
      select task_id, sum(timestampdiff(second, start, end)) * 1000 as time_spent
      from time_entries
      where end is not null and task_id in (${Array(taskIds.length).fill("?").join(",")})
      group by task_id
      `,
    );
    const [rows] = await stmt.execute(taskIds);
    return z
      .array(
        z
          .object({ task_id: z.string(), time_spent: z.coerce.number() })
          .transform((row) => ({
            taskId: row.task_id,
            timeSpent: row.time_spent,
          })),
      )
      .parse(rows);
  });

  return records ?? [];
}
