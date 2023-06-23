import { Component, For, createResource } from "solid-js";
import { client } from "../client";
import { Fields } from "../resources/fields";
import { dueDate, session } from "../stores/params";
import { formatTime } from "../utils";
import Dash from "./Dash";

const Epics: Component<{ data: Fields }> = (props) => {
  const [epics] = createResource(() =>
    client.epics.query({ session: session() })
  );

  const sortedEpics = () =>
    epics()?.sort(
      (a, b) =>
        (a.due_date?.getTime() ?? Number.MAX_VALUE) -
        (b.due_date?.getTime() ?? Number.MAX_VALUE)
    );

  return (
    <>
      <h4 class="text-center font-semibold">État des épics pour la session</h4>
      <ul class="w-[95%] mx-auto">
        <li class="grid grid-cols-[1fr_120px_70px_70px_70px_70px] items-center text-center">
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
                <div class="grid grid-cols-[1fr_120px_70px_70px_70px_70px] items-center">
                  <div class="text-sm">{epic.name}</div>

                  <div class="flex text-sm items-center justify-center">
                    {epic.due_date ? (
                      <>
                        {dueDate() >= epic.due_date && (
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
                    {Math.round(
                      (100 * epic.completedTicketCount) /
                        Math.max(epic.ticketCount, 1)
                    )}
                    %
                  </div>

                  <div class="text-sm text-center">
                    {formatTime(epic.totalTimePlanned)}
                  </div>

                  <div class="text-sm text-center">
                    <span>{formatTime(epic.totalTimeSpent)}</span>
                    <span class="font-semibold text-xs pl-1">
                      (
                      {Math.round(
                        (100 * epic.totalTimeSpent) /
                          Math.max(epic.totalTimePlanned, 1)
                      )}
                      %)
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
