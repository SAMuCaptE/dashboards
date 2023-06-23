import { TRPCError } from "@trpc/server";
import { TimeEntry } from "schemas/time-entry";
import { User } from "../schemas/user";
import { getAllTimeEntries } from "./time-entries";

type WorkedHoursResult = Record<
  "admin" | "elec" | "info" | "mec" | "unknown" | "average",
  Record<User["id"], number>
>;

function convertTags(tags: TimeEntry["task_tags"]) {
  const names = tags.map((t) => t.name);
  if (names.includes("admin")) {
    return "admin";
  } else if (names.includes("élec")) {
    return "elec";
  } else if (names.includes("info")) {
    return "info";
  } else if (names.includes("mec")) {
    return "mec";
  }
  return "unknown";
}

export async function getWorkedHours(start: Date, end: Date) {
  const timeEntries = await getAllTimeEntries();

  if (!timeEntries) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find some time entries.",
    });
  }

  const result: WorkedHoursResult = {
    admin: {},
    elec: {},
    info: {},
    mec: {},
    unknown: {},
    average: {},
  };

  const now = new Date().getTime();
  const averageStartDate = new Date(process.env.HOURS_START_DATE!).getTime();
  const weekLength = 7 * 24 * 60 * 60 * 1000;
  const weekCount =
    Math.floor((now - averageStartDate) / weekLength) -
    parseInt(process.env.HOURS_WEEKLY_OFFSET!);

  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    const moment = new Date(timeEntry.end).getTime();
    const durationInHours = timeEntry.duration / 3600_000;

    if (start.getTime() <= moment && end.getTime() > moment) {
      result[convertTags(timeEntry.task_tags)][timeEntry.user.id] ??= 0;
      result[convertTags(timeEntry.task_tags)][timeEntry.user.id] +=
        durationInHours;
    }

    result["average"][timeEntry.user.id] ??= 0;
    result["average"][timeEntry.user.id] += durationInHours / weekCount;
  }

  return result;
}
