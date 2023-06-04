import { getAllTimeEntries } from "./time-entries";

export async function getWorkedHours(args: { start: Date; end: Date }) {
  const timeEntries = await getAllTimeEntries();
  if (!timeEntries) {
    return null;
  }

  const result: Record<number, { average: number; weekly: number }> = {};
  const weekCount =
    Math.floor(
      (new Date().getTime() -
        new Date(process.env.HOURS_START_DATE).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ) + parseInt(process.env.HOURS_WEEKLY_OFFSET);

  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    if (!result[timeEntry.user.id]) {
      result[timeEntry.user.id] = { weekly: 0, average: 0 };
    }

    const moment = new Date(timeEntry.end).getTime();
    const durationInHours = timeEntry.duration / 3600_000;

    result[timeEntry.user.id].average += durationInHours / weekCount;
    if (args.start.getTime() <= moment && args.end.getTime() > moment) {
      result[timeEntry.user.id].weekly += durationInHours;
    }
  }

  return result;
}
