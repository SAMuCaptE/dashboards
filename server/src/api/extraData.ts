import { convertTags } from "../utils";
import { getAllTimeEntries } from "./time-entries";

type HourRecord = Record<ReturnType<typeof convertTags>, number>;

const emptyHours: HourRecord = {
  admin: 0,
  elec: 0,
  info: 0,
  mec: 0,
  livrables: 0,
  unknown: 0,
};

export async function getExtraData() {
  const timeEntries = await getAllTimeEntries();

  if (!timeEntries) {
    throw new Error("Could not find time entries");
  }

  const workedHours: Record<
    number,
    Record<ReturnType<typeof convertTags>, number>
  > = {};

  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    workedHours[timeEntry.user.id] ??= { ...emptyHours };
    workedHours[timeEntry.user.id][convertTags(timeEntry.task_tags)] +=
      timeEntry.duration / 3600_000;
  }

  return { workedHours };
}
