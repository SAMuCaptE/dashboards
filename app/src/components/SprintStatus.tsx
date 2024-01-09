import { Fields } from "dashboards-server";
import {
    Accessor,
    Component,
    createMemo,
    createSignal,
    For,
    Show
} from "solid-js";
import { sprintTasks } from "../resources/tasks";
import { domainIcons, formatTime, tagToDomainIcon } from "../utils";
import Dash from "./Dash";
import NoPrint from "./NoPrint";

type Defined<T> = Exclude<T, undefined>;

type Problem = { description: string; taskId: string };
type Task = Defined<ReturnType<typeof sprintTasks>>[number];
type TaskWithProblem = Task & {
  problems: Problem[];
};

const statusLabels = {
  open: "Disponible",
  "to do": "À faire",
  "in progress": "En cours",
  review: "En revue",
  complete: "Complétée",
  blocked: "Bloquée",
  closed: "Fermée",
  shipping: "Commande",
};

const statusOrder = {
  open: 0,
  "to do": 1,
  "in progress": 2,
  review: 3,
  complete: 4,
  shipping: 5,
  blocked: 6,
  closed: 6,
};

const SprintStatus: Component<{
  data: Fields;
  itemCount: number;
  offset?: number;
}> = (props) => {
  const parentTasks = createMemo(
    () => sprintTasks()?.filter((task) => task.parent === null) ?? [],
  );

  function addProblems(task: Task) {
    const associatedProblems = props.data.sprint.problems.filter(
      (problem) => problem.taskId === task.id,
    );
    return { ...task, problems: associatedProblems };
  }

  const subtasks = createMemo(() => {
    const counts: Record<string, TaskWithProblem[]> = {};
    for (const task of sprintTasks() ?? []) {
      if (task.parent !== null) {
        counts[task.parent] ??= [];
        counts[task.parent].push(addProblems(task));
      }
    }
    return counts;
  });

  const orderedTasks = createMemo(() =>
    parentTasks().sort((a, b) =>
      statusOrder[a.status.status] > statusOrder[b.status.status] ? 1 : -1,
    ),
  );

  const tasksWithProblems = () => orderedTasks().map(addProblems);

  const selectedTasks = () => {
    const t = tasksWithProblems();
    return t.slice(
      props.offset ?? 0,
      (props.offset ?? 0) + props.itemCount ?? t?.length ?? 0,
    );
  };

  return (
    <>
      <h4 class="mt-2 text-center font-semibold">État du sprint en cours</h4>
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
          each={selectedTasks()}
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
            <Task
              task={() => task}
              subtasks={() => subtasks()[task.id] ?? []}
            />
          )}
        </For>
      </ul>
    </>
  );
};

const Task = (props: {
  task: Accessor<TaskWithProblem>;
  subtasks: Accessor<TaskWithProblem[]>;
  offset?: boolean;
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
        <a href={props.task().url} target="_blank">
          <div class="grid grid-cols-[80px_1fr_120px_70px_70px] items-center">
            <div
              class="rounded-full w-fit px-2 mx-auto z-10"
              style={{ "background-color": props.task().status.color }}
            >
              <p class="uppercase font-black text-white text-center text-[0.65rem]">
                {statusLabels[props.task().status.status]}
              </p>
            </div>

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
                    style={{ color: tag.tag_fg }}
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
                      <p>{problem.description}</p>
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
            <Task task={() => subtask} subtasks={() => []} offset={true} />
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
