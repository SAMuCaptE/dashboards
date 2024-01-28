import { User } from "../schemas/user";
import { convertTags } from "../utils";
import { getAllTimeEntries, getTimeEntriesInRange } from "./time-entries";

type WorkedHoursResult = Record<
  ReturnType<typeof convertTags> | "average",
  Record<User["id"], number>
>;

export async function getWorkedHours(start: Date, end: Date) {
  const timeEntries = await getTimeEntriesInRange(start, end);

  const result: WorkedHoursResult = {
    admin: {},
    elec: {},
    info: {},
    mec: {},
    livrables: {},
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
    const durationInHours = timeEntry.duration / 3600_000;

    result[convertTags(timeEntry.task_tags)][timeEntry.user.id] ??= 0;
    result[convertTags(timeEntry.task_tags)][timeEntry.user.id] +=
      durationInHours;
  }

  const allTimeEntries = await getAllTimeEntries();
  for (const timeEntry of allTimeEntries ?? []) {
    if (timeEntry) {
      const durationInHours = timeEntry.duration / 3600_000;
      result["average"][timeEntry.user.id] ??= 0;
      result["average"][timeEntry.user.id] += durationInHours / weekCount;
    }
  }

  return result;
}
