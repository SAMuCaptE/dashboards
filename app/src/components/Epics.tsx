import { Fields } from "dashboards-server";
import { Component, createResource, For, Show } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";
import { domainIcons, formatTime } from "../utils";
import Dash from "./Dash";

const Epics: Component<{ data: Fields }> = (props) => {
  const [epics] = createResource(() => client.epics.query({ session }));

  const shownEpics = () =>
    epics()?.filter((epic) => !epic.tags.some((tag) => tag.name === "no-show"));

  const sortedEpics = () =>
    shownEpics()?.sort(
      (a, b) =>
        (a.due_date?.getTime() ?? Number.MAX_VALUE) -
        (b.due_date?.getTime() ?? Number.MAX_VALUE),
    );

  return (
    <>
      <h4 class="text-center font-semibold">État des épics pour la session</h4>
      <ul class="w-[95%] mx-auto">
        <li class="grid grid-cols-[1fr_120px_70px_70px_70px_80px] items-center text-center">
          <p>
            <strong>Épic</strong>
          </p>
          <p>
            <strong>Date d'échéance</strong>
          </p>
          <p>
            <strong>Tickets</strong>
          </p>
          <p>
            <strong>Progrès</strong>
          </p>
          <p>
            <strong>Prévu</strong>
          </p>
          <p>
            <strong>Réel</strong>
          </p>
        </li>

        <For
          each={sortedEpics()}
          fallback={
            <li>
              <p class="font-bold text-center mt-6">
                Aucun épic n'a été trouvé
              </p>
            </li>
          }
        >
          {(epic) => (
            <li class="even:bg-gray-200 py-1">
              <a href={epic.url} target="_blank">
                <div class="grid grid-cols-[1fr_120px_70px_70px_70px_80px] items-center">
                  <div class="flex text-sm items-center">
                    <span class="material-symbols-outlined text-sm font-bold pr-1">
                      {domainIcons[epic.domain as keyof typeof domainIcons] ||
                        domainIcons.unknown}
                    </span>
                    <span>{epic.name}</span>
                  </div>

                  <div class="flex text-sm items-center justify-center">
                    {epic.due_date ? (
                      <>
                        {new Date(dueDate).getTime() >=
                          epic.due_date.getTime() && (
                          <span class="material-symbols-outlined text-red-500">
                            event_busy
                          </span>
                        )}
                        <span class="pl-1">
                          {epic.due_date.toLocaleDateString("fr-CA")}
                        </span>
                      </>
                    ) : (
                      <Dash />
                    )}
                  </div>

                  <div class="text-sm text-center">{epic.ticketCount}</div>

                  <div class="text-sm text-center">
                    <Show when={epic.ticketCount > 0} fallback={"N/A"}>
                      {Math.round(
                        (100 * epic.completedTicketCount) / epic.ticketCount,
                      )}
                      %
                    </Show>
                  </div>

                  <div class="text-sm text-center">
                    {formatTime(epic.totalTimePlanned)}
                  </div>

                  <div class="text-sm text-center">
                    <span>{formatTime(epic.totalTimeSpent)}</span>
                    <span
                      class={`text-xs pl-1 ${
                        epic.totalTimeSpent /
                          Math.max(epic.totalTimePlanned, 1) >
                        1
                          ? "text-red-600 font-bold"
                          : "font-semibold"
                      }`}
                    >
                      (
                      <Show when={epic.totalTimePlanned > 0} fallback={"N/A"}>
                        {Math.round(
                          (100 * epic.totalTimeSpent) / epic.totalTimePlanned,
                        )}
                        %
                      </Show>
                      )
                    </span>
                  </div>
                </div>
              </a>
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

export default Epics;
