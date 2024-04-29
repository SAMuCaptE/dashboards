import { Problem, TaskWithProblem } from "common";
import {
    Accessor,
    Component,
    createSignal,
    For,
    Resource,
    Show,
    Suspense
} from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import { dueDate, endDate, session } from "../stores/params";
import { colors, domainIcons, formatTime, tagToDomainIcon } from "../utils";
import AddButton from "./AddButton";
import { Chip } from "./Chip";
import Dash from "./Dash";
import Editable from "./Editable";
import Loader from "./Loader";
import NoPrint from "./NoPrint";

const statusLabels = {
  open: "Disponible",
  "to do": "À faire",
  "in progress": "En cours",
  review: "En revue",
  complete: "Complétée",
  blocked: "Bloquée",
  closed: "Fermée",
  shipping: "Commande",
  cancelled: "Annulée",
};

const SprintStatus: Component<{
  sprintId: Resource<string | null>;
  tasks: Resource<{
    tasks: TaskWithProblem[];
    subtasks: Record<string, TaskWithProblem[]>;
    timeTotals: { actual: number; planned: number };
  }>;
  refetch: Function;
  refetchSprint: Function;
  itemCount: number;
  offset?: number;
}> = (props) => {
  return (
    <Suspense
      fallback={
        <div class="mx-auto w-fit pt-6">
          <Loader />
        </div>
      }
    >
      <ul class="w-[95%] mx-auto pt-3">
        <li class="grid grid-cols-[80px_1fr_120px_70px_70px] items-center">
          <Editable
            initialValue={props.sprintId() ?? undefined}
            onEdit={async (id) => {
              await makeRequest(`/fields/${session}/${dueDate}/sprint`).post(
                z.any(),
                id,
              );
              await props.refetchSprint();
            }}
          >
            <p class="text-center">
              <strong>Sprint</strong>
            </p>
          </Editable>

          <p>
            <strong>Tâche</strong>
          </p>
          <p class="text-center">
            <strong>Responsable(s)</strong>
          </p>
          <p class="text-center flex flex-col">
            <strong class="leading-5">Prévu</strong>
            <span class="text-sm font-bold leading-3">
              <Time time={props.tasks()?.timeTotals.planned ?? 0} />
            </span>
          </p>
          <p class="text-center flex flex-col">
            <strong class="leading-5">Réel</strong>
            <span class="text-sm font-bold leading-3">
              <Time time={props.tasks()?.timeTotals.actual ?? 0} />
            </span>
          </p>
        </li>

        <Suspense
          fallback={
            <div class="mx-auto w-fit">
              <Loader />
            </div>
          }
        >
          <For
            each={props
              .tasks()
              ?.tasks.slice(
                props.offset ?? 0,
                (props.offset ?? 0) + props.itemCount ??
                  props.tasks()?.tasks.length ??
                  0,
              )}
            fallback={
              <li>
                <p class="font-bold text-center mt-6">
                  Aucune tâche n'est associée au sprint '
                  <span class="italic">{props.sprintId()}</span>'.
                </p>
              </li>
            }
          >
            {(task) => (
              <Task
                refetch={props.refetch}
                task={() => task}
                subtasks={() => props.tasks()?.subtasks[task.id] ?? []}
              />
            )}
          </For>
        </Suspense>
      </ul>
    </Suspense>
  );
};

const Task = (props: {
  task: Accessor<TaskWithProblem>;
  subtasks: Accessor<TaskWithProblem[]>;
  offset?: boolean;
  refetch: Function;
}) => {
  const [showSubtasks, setShowSubtasks] = createSignal(false);

  const totalTimeSpent = () =>
    showSubtasks()
      ? props.task().time_spent ?? 0
      : props
          .subtasks()
          .reduce(
            (total, subtask) => total + (subtask.time_spent ?? 0),
            props.task().time_spent ?? 0,
          );

  const totalTimeEstimate = () =>
    showSubtasks()
      ? props.task().time_estimate ?? 0
      : props
          .subtasks()
          .reduce(
            (total, subtask) => total + (subtask.time_estimate ?? 0),
            props.task().time_estimate ?? 0,
          );

  const isLate = () =>
    (props.task().due_date ?? Infinity) < endDate &&
    !["closed", "cancelled", "complete"].includes(props.task().status.status);

  return (
    <>
      <li
        style={{ "border-color": props.task().status.color }}
        class="relative even:bg-gray-200 py-[2px]"
        classList={{
          "pl-4": props.offset,
          "after:block after:h-[110%] after:absolute after:border-inherit after:border-l-2 after:border-b-2 after:w-8 after:rounded-bl after:top-0 after:left-4 after:-translate-y-1/2":
            props.offset,
        }}
      >
        <NoPrint>
          <div class="absolute -right-5">
            <AddButton
              onAdd={async (problem) => {
                await makeRequest(
                  `/fields/${session}/${dueDate}/sprint/problems`,
                ).put(z.any(), {
                  taskId: props.task().id,
                  description: problem,
                });
                await props.refetch();
              }}
            />
          </div>
        </NoPrint>
        <a href={props.task().url} target="_blank">
          <div class="grid grid-cols-[80px_1fr_120px_70px_70px] items-center">
            <Chip
              class="mx-auto"
              label={statusLabels[props.task().status.status]}
              color={props.task().status.color}
            />

            <div class="flex text-sm items-center">
              <For
                each={
                  props.task().tags.length > 0
                    ? props.task().tags
                    : [{ name: "unknown", tag_fg: "#ff80f4" }]
                }
              >
                {(tag) => (
                  <span
                    style={{
                      color:
                        colors[tag.name as keyof typeof colors] ||
                        colors.unknown,
                    }}
                    class="material-symbols-outlined text-sm font-bold pr-1"
                  >
                    {tagToDomainIcon(tag) || domainIcons.unknown}
                  </span>
                )}
              </For>
              <span
                classList={{
                  "font-bold text-rose-600": isLate(),
                }}
              >
                {props.task().name}
              </span>

              <Show when={props.subtasks().length > 0}>
                <NoPrint class="ml-auto group relative">
                  <span class="text-xs group-hover:invisible">
                    [{props.subtasks().length}]
                  </span>
                  <button
                    class="absolute left-1/2 -translate-x-1/2 invisible group-hover:visible"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowSubtasks((show) => !show);
                    }}
                  >
                    <span class="material-symbols-outlined">expand_more</span>
                  </button>
                </NoPrint>
              </Show>
            </div>

            <ul class="flex flex-wrap justify-evenly w-24">
              <For
                each={props
                  .task()
                  .assignees.sort((a, b) =>
                    a.username
                      .split(" ")[1]
                      .localeCompare(b.username.split(" ")[1]),
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
              <Time time={totalTimeEstimate()} />
            </div>

            <div class="h-6 text-sm text-center">
              <Time time={totalTimeSpent()} />
            </div>
          </div>

          <Show when={props.task().problems.length > 0}>
            <div class="grid grid-cols-[80px_1fr] rounded-full border-red-500 border-2 items-center">
              <span class="material-symbols-outlined text-red-500 text-center">
                report
              </span>
              <ul class="flex flex-col">
                <For each={props.task().problems}>
                  {(problem) => (
                    <li class="text-xs">
                      <Editable
                        initialValue={problem.description}
                        onEdit={async (d) => {
                          await makeRequest(
                            `/fields/${session}/${dueDate}/sprint/problems`,
                          ).post(z.any(), {
                            original: problem,
                            updated: {
                              ...problem,
                              description: d,
                            } satisfies Problem,
                          });
                          await props.refetch();
                        }}
                        onDelete={async () => {
                          await makeRequest(
                            `/fields/${session}/${dueDate}/sprint/problems`,
                          ).delete(z.any(), problem);
                          await props.refetch();
                        }}
                      >
                        <p>{problem.description}</p>
                      </Editable>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </a>
      </li>

      <Show when={props.subtasks().length > 0 && showSubtasks()}>
        <For each={props.subtasks()}>
          {(subtask) => (
            <Task
              task={() => subtask}
              subtasks={() => []}
              offset={true}
              refetch={props.refetch}
            />
          )}
        </For>
      </Show>
    </>
  );
};

function Time(props: { time: number }) {
  return <>{formatTime(props.time) || <Dash />}</>;
}

export default SprintStatus;
