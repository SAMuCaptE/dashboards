import {
    Accessor,
    Component,
    createSignal,
    For,
    Resource,
    Show,
    Suspense
} from "solid-js";
import { client } from "../client";
import { TaskWithProblem } from "../resources/tasks";
import { dueDate, session } from "../stores/params";
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
  sprintId: Resource<string>;
  tasks: Resource<{
    tasks: TaskWithProblem[];
    subtasks: Record<string, TaskWithProblem[]>;
  }>;
  refetch: Function;
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
      <h4 class="mt-2 text-center font-semibold relative">
        <Editable
          initialValue={props.sprintId()}
          onEdit={async (id) => {
            await client.fields.sprint.select.mutate({
              dueDate,
              session,
              sprintId: id,
            });
            await props.refetch();
          }}
        >
          État du sprint en cours
        </Editable>
      </h4>
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
                await client.fields.sprint.problems.add.mutate({
                  dueDate,
                  session,
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
              <span>{props.task().name}</span>

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
                          await client.fields.sprint.problems.edit.mutate({
                            ...problem,
                            dueDate,
                            session,
                            updatedDescription: d,
                          });
                          await props.refetch();
                        }}
                        onDelete={async () => {
                          await client.fields.sprint.problems.remove.mutate({
                            ...problem,
                            dueDate,
                            session,
                          });
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
