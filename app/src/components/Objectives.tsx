import { Component, createResource, For, Show, Suspense } from "solid-js";

import { client } from "../client";
import { dueDate, session } from "../stores/params";
import AddButton from "./AddButton";
import Editable from "./Editable";
import Loader from "./Loader";

const Objectives: Component = () => {
  const [daily, { refetch: refetchDaily }] = createResource(() =>
    client.fields.daily.get.query({ dueDate, session }).catch(() => null),
  );
  const [technical, { refetch: refetchTechnical }] = createResource(() =>
    client.fields.technical.get.query({ dueDate, session }).catch(() => null),
  );
  const [objectives, { refetch: refetchObjectives }] = createResource(() =>
    client.fields.objectives.get.query({ dueDate, session }).catch(() => null),
  );

  return (
    <div class="w-[95%] mx-auto">
      <AgendaList
        title="Ordre du jour:"
        items={daily()?.items}
        refetch={refetchDaily}
        add={client.fields.daily.add.mutate}
        update={client.fields.daily.update.mutate}
        delete={client.fields.daily.delete.mutate}
      />
      <AgendaList
        title="Plan technique:"
        items={technical()?.items}
        refetch={refetchTechnical}
        add={client.fields.technical.add.mutate}
        update={client.fields.technical.update.mutate}
        delete={client.fields.technical.delete.mutate}
      />

      <div class="grid grid-cols-[160px_1fr] items-center my-1">
        <p>
          <strong>Objectifs du sprint:</strong>
        </p>
        <Suspense fallback={<Loader />}>
          <Editable
            initialValue={objectives()?.sprint}
            onEdit={async (value) => {
              await client.fields.objectives.sprint.update.mutate({
                dueDate,
                session,
                objective: value,
              });
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
  add: (typeof client)["fields"]["technical"]["add"]["mutate"];
  update: (typeof client)["fields"]["technical"]["update"]["mutate"];
  delete: (typeof client)["fields"]["technical"]["delete"]["mutate"];
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
                      await props.update({
                        session,
                        dueDate,
                        target: item,
                        updated: v,
                      });
                      await props.refetch();
                    }}
                    onDelete={async () => {
                      await props.delete({ session, dueDate, objective: item });
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
        onAdd={async (value) => {
          await props.add({ session, dueDate, objective: value });
          await props.refetch();
        }}
      />
    </div>
  );
};

export default Objectives;
