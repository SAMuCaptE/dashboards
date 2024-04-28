import { Component, createResource, For, Show, Suspense } from "solid-js";
import { z } from "zod";

import { makeRequest } from "../client";
import { dueDate, session } from "../stores/params";
import AddButton from "./AddButton";
import Editable from "./Editable";
import Loader from "./Loader";

function add(route: string) {
  return (element: string) =>
    makeRequest(`/fields/${session}/${dueDate}/${route}`).put(z.any(), element);
}

function update(route: string) {
  return (original: string, updated: string) =>
    makeRequest(`/fields/${session}/${dueDate}/${route}`).post(z.any(), {
      original,
      updated,
    });
}

function remove(route: string) {
  return (element: string) =>
    makeRequest(`/fields/${session}/${dueDate}/${route}`).delete(
      z.any(),
      element,
    );
}

const Objectives: Component = () => {
  const [daily, { refetch: refetchDaily }] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}/daily`)
      .get(z.array(z.string()))
      .catch(() => []),
  );

  const [technical, { refetch: refetchTechnical }] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}/technical`)
      .get(z.array(z.string()))
      .catch(() => []),
  );

  const [objectives, { refetch: refetchObjectives }] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}/objectives`)
      .get(
        z.object({
          sprint: z.string(),
          session: z.string(),
        }),
      )
      .catch(() => null),
  );

  return (
    <div class="w-[95%] mx-auto">
      <AgendaList
        title="Ordre du jour:"
        items={daily()}
        refetch={refetchDaily}
        add={add("daily")}
        update={update("daily")}
        delete={remove("daily")}
      />
      <AgendaList
        title="Plan technique:"
        items={technical()}
        refetch={refetchTechnical}
        add={add("technical")}
        update={update("technical")}
        delete={remove("technical")}
      />

      <div class="grid grid-cols-[160px_1fr] items-center my-1">
        <p>
          <strong>Objectifs du sprint:</strong>
        </p>
        <Suspense fallback={<Loader />}>
          <Editable
            initialValue={objectives()?.sprint}
            onEdit={async (objective) => {
              await makeRequest(
                `/fields/${session}/${dueDate}/objectives/sprint`,
              ).post(z.any(), objective);
              await refetchObjectives();
            }}
          >
            <div class="text-sm">
              <p>{objectives()?.sprint}</p>
            </div>
          </Editable>
        </Suspense>
      </div>

      <div class="grid grid-cols-[160px_1fr] items-center my-1">
        <p>
          <strong>Objectifs de la {session.toUpperCase()}:</strong>
        </p>
        <div class="text-sm">
          <Suspense fallback={<Loader />}>
            <p>{objectives()?.session ?? "Erreur"}</p>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

const AgendaList: Component<{
  title: string;
  items: Array<string> | undefined;
  refetch: Function;
  add: ReturnType<typeof add>;
  update: ReturnType<typeof update>;
  delete: ReturnType<typeof remove>;
}> = (props) => {
  return (
    <div class="grid grid-cols-[120px_1fr] items-center my-1">
      <p>
        <strong>{props.title}</strong>
      </p>
      <Suspense fallback={<Loader />}>
        <Show when={props.items} fallback={<p>Erreur</p>}>
          <ol class="flex border-gray-300 border-2 rounded-full w-fit">
            <For each={props.items}>
              {(item) => (
                <li class="px-3 py-1 text-sm border-r-2 border-gray-300 last:border-r-0">
                  <Editable
                    initialValue={item}
                    onEdit={async (v) => {
                      await props.update(item, v);
                      await props.refetch();
                    }}
                    onDelete={async () => {
                      await props.delete(item);
                      await props.refetch();
                    }}
                  >
                    <p>{item}</p>
                  </Editable>
                </li>
              )}
            </For>
          </ol>
        </Show>
      </Suspense>

      <AddButton
        onAdd={async (item) => {
          await props.add(item);
          await props.refetch();
        }}
      />
    </div>
  );
};

export default Objectives;
