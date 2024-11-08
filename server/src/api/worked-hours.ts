import { User } from "common";
import { convertTags } from "../utils";
import { getAllTimeEntries, getTimeEntriesInRange } from "./time-entries";

type WorkedHoursResult = Record<
  ReturnType<typeof convertTags> | "total",
  Record<User["id"], number>
> & { weekCount: number };

export async function getWorkedHours(start: Date, end: Date) {
  const timeEntries = await getTimeEntriesInRange(start, end);

  const averageStartDate = new Date(process.env.HOURS_START_DATE!).getTime();
  const weekLength = 7 * 24 * 60 * 60 * 1000;
  const weekCount =
    Math.floor((end.getTime() - averageStartDate) / weekLength) -
    parseInt(process.env.HOURS_WEEKLY_OFFSET!);

  const result: WorkedHoursResult = {
    admin: {},
    elec: {},
    info: {},
    mec: {},
    livrables: {},
    mega: {},
    unknown: {},
    total: {},
    weekCount,
  };

  for (const timeEntry of timeEntries) {
    const durationInHours = timeEntry.duration / 3600_000;

    result[convertTags(timeEntry.task_tags)][timeEntry.user.id] ??= 0;
    result[convertTags(timeEntry.task_tags)][timeEntry.user.id] +=
      durationInHours;
  }

  const allTimeEntries = await getAllTimeEntries();
  for (const timeEntry of allTimeEntries ?? []) {
    if (timeEntry) {
      const durationInHours = timeEntry.duration / 3600_000;
      result["total"][timeEntry.user.id] ??= 0;
      result["total"][timeEntry.user.id] += durationInHours;
    }
  }

  return result;
}
