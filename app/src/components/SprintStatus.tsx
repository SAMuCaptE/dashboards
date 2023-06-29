import { Component, For, Show, createMemo } from "solid-js";
import { Fields } from "../resources/fields";
import { sprintTasks } from "../resources/tasks";
import { formatTime } from "../utils";
import Dash from "./Dash";

const statusLabels = {
  open: "Disponible",
  "to do": "À faire",
  "in progress": "En cours",
  review: "En revue",
  complete: "Complétée",
  blocked: "Bloquée",
  closed: "Fermée",
};

const statusOrder = {
  open: 0,
  "to do": 1,
  "in progress": 2,
  review: 3,
  complete: 4,
  blocked: 5,
  closed: 5,
};

const SprintStatus: Component<{ data: Fields }> = (props) => {
  const orderedTasks = createMemo(() =>
    sprintTasks()?.sort((a, b) =>
      statusOrder[a.status.status] > statusOrder[b.status.status] ? 1 : -1
    )
  );

  const tasksWithProblems = () =>
    orderedTasks()?.map((task) => {
      const associatedProblems = props.data.sprint.problems.filter(
        (problem) => problem.taskId === task.id
      );
      return { ...task, problems: associatedProblems };
    });

  return (
    <>
      <h4 class="text-center font-semibold">État du sprint en cours</h4>
      <ul class="w-[95%] mx-auto">
        <li class="grid grid-cols-[80px_1fr_120px_70px_70px] items-center">
          <div> </div>
          <p>
            <strong>Tâche</strong>
          </p>
          <p class="text-center">
            <strong>Responsable(s)</strong>
          </p>
          <p class="text-center">
            <strong>Prévu</strong>
          </p>
          <p class="text-center">
            <strong>Réel</strong>
          </p>
        </li>

        <For
          each={tasksWithProblems()}
          fallback={
            <li>
              <p class="font-bold text-center mt-6">
                Aucune tâche n'est associée au sprint '
                <span class="italic">{props.data.sprint.id}</span>'.
              </p>
            </li>
          }
        >
          {(task) => (
            <li class="even:bg-gray-200 py-[2px]">
              <a href={task.url} target="_blank">
                <div class="grid grid-cols-[80px_1fr_120px_70px_70px] items-center">
                  <div
                    class="rounded-full w-fit px-2 mx-auto"
                    style={{ "background-color": task.status.color }}
                  >
                    <p class="uppercase font-black text-white text-center text-[0.65rem]">
                      {statusLabels[task.status.status]}
                    </p>
                  </div>

                  <div class="text-sm">{task.name}</div>

                  <ul class="flex flex-wrap justify-evenly w-24">
                    <For
                      each={task.assignees.sort((a, b) =>
                        a.username
                          .split(" ")[1]
                          .localeCompare(b.username.split(" ")[1])
                      )}
                      fallback={
                        <li>
                          <Dash />
                        </li>
                      }
                    >
                      {(assignee) => (
                        <li
                          class="w-6 h-6 rounded-full block object-contain"
                          style={{ "background-color": assignee.color }}
                        >
                          {assignee.profilePicture ? (
                            <img src={assignee.profilePicture} />
                          ) : (
                            <p class="font-semibold text-white text-center text-[0.65rem] leading-6 align-middle">
                              {assignee.initials}
                            </p>
                          )}
                        </li>
                      )}
                    </For>
                  </ul>

                  <div class="h-6 text-sm text-center">
                    {task.time_estimate ? (
                      formatTime(task.time_estimate)
                    ) : (
                      <Dash />
                    )}
                  </div>

                  <div class="h-6 text-sm text-center">
                    {task.time_spent ? formatTime(task.time_spent) : <Dash />}
                  </div>
                </div>

                <Show when={task.problems.length > 0}>
                  <div class="grid grid-cols-[80px_1fr] rounded-full border-red-500 border-2 items-center">
                    <span class="material-symbols-outlined text-red-500 text-center">
                      report
                    </span>
                    <ul class="flex flex-col">
                      <For each={task.problems}>
                        {(problem) => (
                          <li class="text-xs">
                            <p>{problem.description}</p>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                </Show>
              </a>
            </li>
          )}
        </For>
      </ul>
    </>
  );
};

export default SprintStatus;
