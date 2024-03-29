import {
    Component,
    createEffect,
    createMemo,
    createResource,
    createSignal,
    For,
    on,
    Suspense
} from "solid-js";
import { client } from "../client";
import { users } from "../resources/users";
import { endDate, startDate } from "../stores/params";
import { colors, domainIcons, formatTime, tagToDomainIcon } from "../utils";
import Loader from "./Loader";
import NoPrint from "./NoPrint";

const TimeEntries: Component = () => {
  const [expanded, setExpanded] = createSignal<Record<number, boolean>>({});

  const sortedUsers = createMemo(() =>
    (users()?.members ?? []).sort((a, b) =>
      a.username.split(" ")[1].localeCompare(b.username.split(" ")[1]),
    ),
  );

  createEffect(
    on([sortedUsers], () => {
      setExpanded(
        sortedUsers().reduce(
          (acc, user) => ({
            ...acc,
            [user.id]: false,
          }),
          {},
        ),
      );
    }),
  );

  const [timeEntries] = createResource(sortedUsers, async () => {
    if (sortedUsers().length < 0) {
      return null;
    }

    const result: Record<
      number,
      Awaited<ReturnType<(typeof client)["timeEntries"]["query"]>>
    > = {};

    const entries = await client.timeEntries.query({
      start: startDate.getTime(),
      end: endDate.getTime(),
    });

    for (const user of sortedUsers()) {
      result[user.id] = [];
    }

    if (entries) {
      for (const entry of entries) {
        result[entry.user.id].push(entry);
      }
    }

    return result;
  });

  return (
    <NoPrint>
      <div class="mx-auto w-fit pt-3 min-h-[600px]">
        <h3 class="text-lg font-medium text-center">
          Détails des heures saisies
        </h3>

        <Suspense
          fallback={
            <div class="w-fit mx-auto pt-2">
              <Loader />
            </div>
          }
        >
          <ul>
            <For each={sortedUsers()}>
              {(user) => (
                <li class="py-2">
                  <button
                    class="flex items-center"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [user.id]: !prev[user.id],
                      }))
                    }
                  >
                    <span class="material-symbols-outlined">expand_more</span>
                    <div class="font-semibold text-md">{user.username}</div>
                  </button>

                  <ul>
                    <For each={timeEntries()?.[user.id] ?? []}>
                      {(entry) => (
                        <li classList={{ hidden: !expanded()[user.id] }}>
                          <a
                            target="_blank"
                            href={entry.task_url}
                            class="grid grid-cols-[60px_100px_40px_auto]"
                          >
                            <div class="text-center">
                              {formatTime(entry.duration)}
                            </div>
                            <div class="text-center">
                              {new Date(entry.end).toLocaleDateString("fr-CA")}
                            </div>

                            <div class="flex text-sm items-center justify-center">
                              <For
                                each={
                                  entry.task_tags.length > 0
                                    ? entry.task_tags
                                    : [{ name: "unknown", tag_fg: "#ff80f4" }]
                                }
                              >
                                {(tag) => (
                                  <span
                                    style={{
                                      color:
                                        colors[
                                          tag.name as keyof typeof colors
                                        ] || colors.unknown,
                                    }}
                                    class="material-symbols-outlined text-sm font-bold pr-1"
                                  >
                                    {tagToDomainIcon(tag) ||
                                      domainIcons.unknown}
                                  </span>
                                )}
                              </For>
                            </div>

                            <div>{entry.task.name}</div>
                          </a>
                        </li>
                      )}
                    </For>
                  </ul>
                </li>
              )}
            </For>
          </ul>
        </Suspense>
      </div>
    </NoPrint>
  );
};

export default TimeEntries;
