import { TRPCError } from "@trpc/server";
import { getAllTimeEntries } from "./time-entries";

export async function getExtraData() {
  const timeEntries = await getAllTimeEntries();

  if (!timeEntries) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find time entries",
    });
  }

  const workedHours: Record<number, number> = {};

  for (const timeEntry of timeEntries) {
    if (!timeEntry) {
      throw new Error("Some time entry was null.");
    }

    workedHours[timeEntry.user.id] ??= 0;
    workedHours[timeEntry.user.id] += timeEntry.duration / 3600_000;
  }

  return { workedHours };
}
