import { TimeEntry } from "common";
import {
  Component,
  createContext,
  createMemo,
  createResource,
  JSX,
  Resource,
  useContext,
} from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import { users } from "../resources/users";
import { endDate, startDate } from "../stores/params";

export const hourCategories = [
  "unknown",
  "admin",
  "mec",
  "elec",
  "info",
  "livrables",
] as const;

type TimeContext = {
  addTimeEntry: (userId: number, entry: TimeEntry) => void;
  removeTimeEntry: (userId: number, entry: TimeEntry) => void;
  workedHours: Resource<
    readonly [Record<string, Record<string, number>>, number]
  >;
  timeEntries: Resource<Record<number, Array<TimeEntry>> | null>;
  extraData: Resource<
    Record<number, Partial<Record<(typeof hourCategories)[number], number>>>
  >;
};

const TimeContext = createContext<TimeContext>();
export const useTime = () => useContext(TimeContext);

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
  } else if (names.includes("livrables")) {
    return "livrables";
  }
  return "unknown";
}

const TimeProvider: Component<{ children: JSX.Element }> = (props) => {
  const sortedUsers = createMemo(() =>
    (users() ?? []).sort((a, b) =>
      a.username.split(" ")[1].localeCompare(b.username.split(" ")[1]),
    ),
  );

  const [extraData, { mutate: mutateExtraData }] = createResource(() =>
    makeRequest("/extra").get(
      z.record(z.coerce.number(), z.record(z.enum(hourCategories), z.number())),
    ),
  );

  const [timeEntries, { mutate: mutateTimeEntries }] = createResource(
    sortedUsers,
    async () => {
      if (sortedUsers().length < 0) {
        return null;
      }

      const entries = await makeRequest("/time-entries").get(
        z.array(TimeEntry),
        new URLSearchParams({
          start: startDate.getTime().toString(),
          end: endDate.getTime().toString(),
        }),
      );

      const result: Record<number, Array<TimeEntry>> = {};
      for (const user of sortedUsers()) {
        result[user.id] = [];
      }

      if (entries) {
        for (const entry of entries) {
          result[entry.user.id].push(entry);
        }
      }

      return result;
    },
  );

  const [workedHours, { mutate: mutateWorkedHours }] = createResource(() =>
    makeRequest("/hours")
      .get(
        z.record(z.string(), z.record(z.string(), z.number()).or(z.number())),
        new URLSearchParams({
          start: startDate.getTime().toString(),
          end: endDate.getTime().toString(),
        }),
      )
      .then((hours) => {
        const formatted = Object.entries(hours).reduce(
          (acc, [key, value]) =>
            typeof value === "number" ? acc : { ...acc, [key]: value },
          {} as Record<string, Record<string, number>>,
        );
        return [formatted, hours.weekCount as number] as const;
      }),
  );

  const addTimeEntry = (userId: number, entry: TimeEntry) => {
    mutateTimeEntries((previous) => ({
      ...(previous ?? {}),
      [userId]: [...(previous?.[userId] ?? []), entry],
    }));
    mutateExtraData((previous) => ({
      ...(previous ?? {}),
      [userId]: {
        ...(previous?.[userId] ?? {}),
        [convertTags(entry.task_tags)]:
          (previous?.[userId]?.[convertTags(entry.task_tags)] ?? 0) +
          entry.duration / 3600_000,
      },
    }));
    mutateWorkedHours((previous) => {
      if (!previous) {
        return previous;
      }
      const [hours, weekCount] = previous;
      return [
        {
          ...hours,
          [convertTags(entry.task_tags)]: {
            ...hours[convertTags(entry.task_tags)],
            [userId]:
              (hours[convertTags(entry.task_tags)]?.[userId] ?? 0) +
              entry.duration / 3600_000,
          },
          total: {
            ...(hours.total ?? {}),
            [userId]: (hours.total[userId] ?? 0) + entry.duration / 3600_000,
          },
        },
        weekCount,
      ];
    });
  };

  const removeTimeEntry = (userId: number, entry: TimeEntry) => {
    makeRequest(`/time-entries/${entry.id}`).delete(z.any());
    mutateTimeEntries((previous) => ({
      ...(previous ?? {}),
      [userId]: (previous?.[userId] ?? []).filter((e) => e.id !== entry.id),
    }));
    mutateExtraData((previous) => ({
      ...(previous ?? {}),
      [userId]: {
        ...(previous?.[userId] ?? {}),
        [convertTags(entry.task_tags)]: Math.max(
          (previous?.[userId]?.[convertTags(entry.task_tags)] ?? 0) -
            entry.duration / 3600_000,
          0,
        ),
      },
    }));
    mutateWorkedHours((previous) => {
      if (!previous) {
        return previous;
      }
      const [hours, weekCount] = previous;
      return [
        {
          ...hours,
          [convertTags(entry.task_tags)]: {
            ...hours[convertTags(entry.task_tags)],
            [userId]: Math.max(
              (hours[convertTags(entry.task_tags)]?.[userId] ?? 0) -
                entry.duration / 3600_000,
              0,
            ),
          },
          total: {
            ...(hours.total ?? {}),
            [userId]: Math.max(
              (hours.total[userId] ?? 0) - entry.duration / 3600_000,
              0,
            ),
          },
        },
        weekCount,
      ];
    });
  };

  return (
    <TimeContext.Provider
      value={{
        addTimeEntry,
        removeTimeEntry,
        workedHours,
        timeEntries,
        extraData,
      }}
    >
      {props.children}
    </TimeContext.Provider>
  );
};

export default TimeProvider;
