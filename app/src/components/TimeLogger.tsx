import { OngoingTimeEntry, Task } from "common";
import {
  Component,
  createEffect,
  createSignal,
  For,
  on,
  onMount,
  Show,
} from "solid-js";
import { date, z } from "zod";
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
  const [selectedUserId, setSelectedUserId] = createSignal<string>(
    localStorage.getItem(USER_ID) ?? "",
  );

  const [startTime, setStartTime] = createSignal(new Date());
  const [endTime, setEndTime] = createSignal(new Date());
  const [timerIsActive, setTimerIsActive] = createSignal(false);
  const [ongoingId, setOngoingId] = createSignal<number | null>(null);

  const [fetchingTask, setFetchingTask] = createSignal(false);
  const [taskInput, setTaskInput] = createSignal(
    localStorage.getItem(TASK_ID) ?? "",
  );
  const [taskDetails, setTaskDetails] = createSignal<Task | null>(null);

  const [loading, setLoading] = createSignal(false);

  onMount(async () => {
    setLoading(true);
    await fetchOngoing(selectedUserId());
    setLoading(false);
  });

  const handleUserSelect = async (
    ev: Event & { target: HTMLSelectElement },
  ) => {
    if (timerIsActive()) {
      return;
    }
    const userId = ev.target.value;
    localStorage.setItem(USER_ID, userId);
    setLoading(true);
    setSelectedUserId(userId);
    await fetchOngoing(userId);
    setLoading(false);
  };

  const clearForm = () => {
    const d = new Date();
    setStartTime(d);
    setEndTime(d);
  };

  const handleSubmit = async (ev: Event) => {
    ev.preventDefault();
    if (timerIsActive()) {
      return;
    }

    setLoading(true);
    const taskId = parseTaskId(taskInput());
    await makeRequest("/time-entries").post(z.any(), {
      taskId,
      userId: selectedUserId(),
      start: startTime().getTime(),
      end: endTime().getTime(),
    });
    clearForm();
    setLoading(false);
  };

  const fetchOngoing = async (userId: string) => {
    const params = new URLSearchParams({ userId });
    const ongoing = await makeRequest(
      `/time-entries/ongoing?${params.toString()}`,
    ).get(
      z
        .object({
          id: z.number(),
          start: z.number().transform((num) => new Date(num)),
          taskId: z.string(),
          userId: z.coerce.string(),
        })
        .or(z.null()),
    );

    if (ongoing === null) {
      setTimerIsActive(false);
    } else {
      setStartTime(ongoing.start);
      setSelectedUserId(ongoing.userId);
      setTaskInput(ongoing.taskId);
      setOngoingId(ongoing.id);
      setTimerIsActive(true);
    }
  };

  const handleManualTimer = async () => {
    setLoading(true);
    const isActive = setTimerIsActive((active) => !active);
    if (isActive) {
      try {
        await makeRequest("/time-entries").post(z.any(), {
          userId: selectedUserId(),
          taskId: parseTaskId(taskInput()),
          start: startTime().getTime(),
        });
        await fetchOngoing(selectedUserId());
      } catch (err) {
        console.error(err);
        setTimerIsActive(false);
        setOngoingId(null);
      }
    } else {
      await makeRequest(`/time-entries/${ongoingId()}`).put(z.any(), {
        end: new Date().getTime(),
      });
    }
    clearForm();
    setLoading(false);
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

  let durationInterval: number | undefined = undefined;
  createEffect(() => {
    clearInterval(durationInterval);
    if (timerIsActive()) {
      durationInterval = setInterval(() => setEndTime(new Date()), 1000);
    }
  });

  const duration = () =>
    formatDeltaTime(
      endTime().getTime() - startTime().getTime(),
      timerIsActive(),
    );

  return (
    <NoPrint>
      <Show when={(users() ?? []).length > 0} fallback={<Loader />}>
        <div class="border-black border-2 rounded-lg p-4 my-2 mx-auto max-w-2xl">
          <Show when={loading() === false} fallback={<Loader />}>
            <form onSubmit={handleSubmit}>
              <div class="flex justify-center gap-4">
                <div>
                  <div>
                    <label for={USER_ID} class="pr-2 w-24">
                      <i>SAUM</i>atelot:
                    </label>
                    <select
                      id={USER_ID}
                      name={USER_ID}
                      value={selectedUserId()}
                      disabled={timerIsActive()}
                      onChange={handleUserSelect}
                      class="border-[1px] bg-white px-2 rounded disabled:bg-gray-200"
                    >
                      <option value="">Aucune sélection</option>
                      {users()?.map((user) => (
                        <option value={user.id}>{user.username}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div class="flex pt-1">
                      <label for="task" class="pr-2 w-24">
                        Tâche:
                      </label>
                      <input
                        id="task"
                        type="search"
                        autocomplete="off"
                        value={taskInput()}
                        disabled={timerIsActive()}
                        onChange={(ev) =>
                          setTaskInput((previous) =>
                            timerIsActive() ? previous : ev.target.value,
                          )
                        }
                        class="border-[1px] bg-white px-2 rounded text-sm flex-1 disabled:bg-gray-200"
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
                    <label for="start-datetime" class="pr-2 w-16">
                      Début:
                    </label>
                    <input
                      id="start-datetime"
                      type="datetime-local"
                      disabled={timerIsActive()}
                      value={convertToDateTimeLocalString(startTime())}
                      class="border-[1px] bg-white px-2 rounded flex-1 text-sm disabled:bg-gray-200"
                      onChange={(ev) =>
                        setStartTime((previous) =>
                          timerIsActive()
                            ? previous
                            : new Date(ev.target.value),
                        )
                      }
                    />
                  </div>
                  <div class="flex pt-1">
                    <label for="end-datetime" class="pr-2 w-16">
                      Fin:
                    </label>
                    <input
                      id="end-datetime"
                      type="datetime-local"
                      disabled={timerIsActive()}
                      value={convertToDateTimeLocalString(endTime())}
                      class="border-[1px] bg-white px-2 rounded flex-1 text-sm disabled:bg-gray-200"
                      onChange={(ev) =>
                        setEndTime((previous) =>
                          timerIsActive()
                            ? previous
                            : new Date(ev.target.value),
                        )
                      }
                    />
                  </div>
                  <div class="flex">
                    <p class="pr-2 w-16">Durée:</p>
                    <p>{duration() || "-"}</p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleManualTimer}
                      class="flex items-center border-[1px] px-2 py-1 bg-gray-100 rounded-md mt-3 mx-auto"
                    >
                      <span class="material-symbols-outlined pr-1">timer</span>
                      <p class="text-sm">
                        {timerIsActive()
                          ? "Arrêter le minuteur"
                          : "Démarrer le minuteur"}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={timerIsActive()}
                class="flex items-center mx-auto mt-2 px-2 py-1 bg-gray-100 rounded-md"
              >
                <span class="material-symbols-outlined pr-1">bookmark</span>
                <p class="text-sm">Enregistrer</p>
              </button>
            </form>
          </Show>
        </div>
      </Show>
    </NoPrint>
  );
};

export default TimeLogger;
