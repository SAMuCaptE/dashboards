import { Task } from "common";
import { Component, createEffect, createSignal, For, on, Show } from "solid-js";
import { makeRequest } from "../client";
import { users } from "../resources/users";
import {
  colors,
  convertToDateTimeLocalString,
  debounce,
  domainIcons,
  formatDeltaTime,
  tagToDomainIcon,
} from "../utils";
import Loader from "./Loader";
import NoPrint from "./NoPrint";

const USER_ID = "userId";
const TASK_ID = "taskId";

function parseTaskId(taskOrUrl: string) {
  const taskId = taskOrUrl
    .replace("https://app.clickup.com/t", "")
    .replaceAll("/", "");
  return /^[a-zA-Z0-9]{9}$/.test(taskId) ? taskId : null;
}

const TimeLogger: Component = () => {
  let formRef: HTMLFormElement;

  const [selectedUserId, setSelectedUserId] = createSignal<string>(
    localStorage.getItem(USER_ID) ?? "",
  );

  const [startTime, setStartTime] = createSignal(new Date());
  const [endTime, setEndTime] = createSignal(new Date());
  const [timerIsActive, setTimerIsActive] = createSignal(false);

  const [fetchingTask, setFetchingTask] = createSignal(false);
  const [taskInput, setTaskInput] = createSignal(
    localStorage.getItem(TASK_ID) ?? "",
  );
  const [taskDetails, setTaskDetails] = createSignal<Task | null>(null);

  const handleUserSelect = (ev: Event & { target: HTMLSelectElement }) => {
    localStorage.setItem(USER_ID, ev.target.value);
    setSelectedUserId(ev.target.value);
  };

  const handleSubmit = (ev: Event) => {
    ev.preventDefault();
    console.log("submitted time entry");
  };

  const handleManualTimer = () => {
    const isActive = setTimerIsActive((active) => !active);
    if (isActive === false) {
      formRef.requestSubmit();
    }
  };

  let cancelTaskFetch: Function | null = null;
  createEffect(
    on(taskInput, () => {
      const taskId = parseTaskId(taskInput());
      localStorage.setItem(TASK_ID, taskId ?? "");
      if (!taskId) {
        cancelTaskFetch?.();
        setTaskDetails(null);
        setFetchingTask(false);
        return;
      }

      cancelTaskFetch = debounce(
        "task-fetch",
        async () => {
          if (fetchingTask()) {
            return;
          }

          setFetchingTask(true);
          const task = await makeRequest(`/tasks/${taskId}`).get(Task);
          if (fetchingTask()) {
            setTaskDetails(task);
          }
          setFetchingTask(false);
        },
        250,
      );
    }),
  );

  const duration = () =>
    formatDeltaTime(endTime().getTime() - startTime().getTime());

  return (
    <NoPrint>
      <Show when={(users() ?? []).length > 0} fallback={<Loader />}>
        <div class="border-black border-2 rounded-lg p-4 m-2">
          <form ref={(el) => (formRef = el)} onSubmit={handleSubmit}>
            <div class="flex justify-center gap-4">
              <div>
                <div>
                  <label for={USER_ID} class="pr-2">
                    <i>SAUM</i>atelot:
                  </label>
                  <select
                    id={USER_ID}
                    name={USER_ID}
                    value={selectedUserId()}
                    onChange={handleUserSelect}
                    class="border-[1px] bg-white px-2 rounded"
                  >
                    <option value="">Aucune sélection</option>
                    {users()?.map((user) => (
                      <option value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div class="flex">
                    <label for="task" class="pr-2">
                      Tâche:
                    </label>
                    <input
                      id="task"
                      type="search"
                      autocomplete="off"
                      value={taskInput()}
                      onChange={(ev) => setTaskInput(ev.target.value)}
                      class="border-[1px] bg-white px-2 rounded text-sm flex-1"
                    />
                  </div>
                  <div class="border-[1px] bg-slate-50 rounded-lg p-2 my-2">
                    <Show
                      when={taskDetails()}
                      fallback={
                        <div class="flex justify-center min-h-12">
                          <div class="block relative w-12 aspect-square">
                            <img
                              src={import.meta.env.BASE_URL + "clickup.svg"}
                            />
                          </div>
                        </div>
                      }
                    >
                      <a href={taskDetails()!.url} target="_blank">
                        <div class="flex gap-2 items-center">
                          <div class="block relative w-5 aspect-square">
                            <img
                              src={import.meta.env.BASE_URL + "clickup.svg"}
                            />
                          </div>
                          <div>
                            <p class="font-medium text-sm">
                              {taskDetails()!.name}
                            </p>
                            <div class="flex gap-1">
                              <For each={taskDetails()!.assignees}>
                                {(assignee) => (
                                  <div
                                    class="w-6 h-6 rounded-full block object-contain"
                                    style={{
                                      "background-color": assignee.color,
                                    }}
                                  >
                                    <p class="font-semibold text-white text-center text-[0.65rem] leading-6 align-middle">
                                      {assignee.initials}
                                    </p>
                                  </div>
                                )}
                              </For>
                              <For each={taskDetails()!.tags}>
                                {(tag) => (
                                  <div
                                    style={{
                                      background:
                                        colors[
                                          tag.name as keyof typeof colors
                                        ] || colors.unknown,
                                    }}
                                    class="rounded-full flex items-center px-2 w-fit"
                                  >
                                    <span class="material-symbols-outlined pr-1 font-bold text-xs text-white">
                                      {tagToDomainIcon(tag) ||
                                        domainIcons.unknown}
                                    </span>
                                    <span class="text-white font-medium text-xs">
                                      {tag.name}
                                    </span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                        </div>
                      </a>
                    </Show>
                  </div>
                </div>
              </div>

              <div>
                <div class="flex">
                  <label for="start-datetime" class="pr-2">
                    Début:
                  </label>
                  <input
                    id="start-datetime"
                    type="datetime-local"
                    value={convertToDateTimeLocalString(startTime())}
                    class="border-[1px] bg-white px-2 rounded flex-1"
                    onChange={(ev) => setStartTime(new Date(ev.target.value))}
                  />
                </div>
                <div class="flex">
                  <label for="end-datetime" class="pr-2">
                    Fin:
                  </label>
                  <input
                    id="end-datetime"
                    type="datetime-local"
                    value={convertToDateTimeLocalString(endTime())}
                    class="border-[1px] bg-white px-2 rounded flex-1"
                    onChange={(ev) => setEndTime(new Date(ev.target.value))}
                  />
                </div>
                <div class="flex">
                  <p class="pr-2">Durée:</p>
                  <p>{duration() || "-"}</p>
                </div>

                <div>
                  <button onClick={handleManualTimer} type="button">
                    {timerIsActive()
                      ? "Arrêter le minuteur"
                      : "Démarrer le minuteur"}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit">Enregistrer</button>
          </form>
        </div>
      </Show>
    </NoPrint>
  );
};

export default TimeLogger;
