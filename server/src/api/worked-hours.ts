import { z } from "zod";
import { SpaceSchema } from "../schemas/space";
import { User } from "../schemas/user";
import { getSpaces } from "./spaces";
import { getAllTimeEntries } from "./time-entries";

type Space = z.infer<typeof SpaceSchema>;
type WorkedHoursResult = Record<
  Space["id"] | "average",
  Record<User["id"], number>
>;

export async function getWorkedHours(args: { start: Date; end: Date }) {
  const [timeEntries, spaces] = await Promise.all([
    getAllTimeEntries(),
    getSpaces(),
  ]);
  if (!timeEntries || !spaces) {
    return null;
  }

  const result = spaces.reduce((all, space) => ({ ...all, [space.id]: {} }), {
    average: {},
  }) as WorkedHoursResult;

  const now = new Date().getTime();
  const averageStartDate = new Date(process.env.HOURS_START_DATE).getTime();
  const weekLength = 7 * 24 * 60 * 60 * 1000;
  const weekCount =
    Math.floor((now - averageStartDate) / weekLength) -
    parseInt(process.env.HOURS_WEEKLY_OFFSET);

  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    const moment = new Date(timeEntry.at).getTime();
    const durationInHours = timeEntry.duration / 3600_000;

    if (args.start.getTime() <= moment && args.end.getTime() > moment) {
      result[timeEntry.task_location.space_id][timeEntry.user.id] ??= 0;
      result[timeEntry.task_location.space_id][timeEntry.user.id] +=
        durationInHours;
    }

    result["average"][timeEntry.user.id] ??= 0;
    result["average"][timeEntry.user.id] += durationInHours / weekCount;
  }

  for (const space of spaces) {
    result[space.name] = result[space.id];
    delete result[space.id];
  }

  return result;
}
