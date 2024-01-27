import {
  Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  on,
  Show,
} from "solid-js";
import { client } from "../client";
import { users } from "../resources/users";
import { endDate, startDate } from "../stores/params";
import { colors, domainIcons, formatTime, tagToDomainIcon } from "../utils";
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

  const [timeEntries] = createResource(() =>
    client.timeEntries.query({
      start: startDate.getTime(),
      end: endDate.getTime(),
    }),
  );

  const sortedEntries = createMemo(() => {
    const result: Record<
      number,
      Awaited<ReturnType<(typeof client)["timeEntries"]["query"]>>
    > = {};

    for (const user of sortedUsers()) {
      result[user.id] = [];
    }

    const t = timeEntries();
    if (t) {
      for (const entry of t) {
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
                <Show when={expanded()[user.id]}>
                  <ul>
                    <For each={sortedEntries()[user.id]}>
                      {(entry) => (
                        <li>
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
                </Show>
              </li>
            )}
          </For>
        </ul>
      </div>
    </NoPrint>
  );
};

export default TimeEntries;
