import { Component, For } from "solid-js";

import { Fields } from "dashboards-server";
import { client } from "../client";
import { refetch as refetchFields } from "../resources/fields";
import { dueDate, session } from "../stores/params";
import AddButton from "./AddButton";
import Editable from "./Editable";

const Objectives: Component<{ data: Fields }> = (props) => {
  const rows = [
    ["Ordre du jour:", props.data.meeting.agenda.items],
    ["Plan technique:", props.data.meeting.technical.items],
  ] as const;

  const objectives = () =>
    [
      ["Objectif(s) du sprint:", props.data.sprint.objective],
      [
        `Objectif(s) de la ${session().toUpperCase()}:`,
        props.data.sessions[session()]?.objective,
      ],
    ] as const;

  return (
    <div class="w-[95%] mx-auto">
      <For each={rows}>
        {([title, items], index) => (
          <div class="grid grid-cols-[120px_1fr] items-center my-1">
            <p>
              <strong>{title}</strong>
            </p>
            <ol class="flex border-gray-300 border-2 rounded-full w-fit">
              <For each={items}>
                {(item) => (
                  <li class="px-3 py-1 text-sm border-r-2 border-gray-300 last:border-r-0">
                    <Editable
                      initialValue={item}
                      onEdit={async (v) => {
                        await client.fields[
                          index() === 0 ? "daily" : "technical"
                        ].update.mutate({
                          session: session(),
                          dueDate: dueDate(),
                          target: item,
                          updated: v,
                        });
                        refetchFields();
                      }}
                      onDelete={async () => {
                        await client.fields[
                          index() === 0 ? "daily" : "technical"
                        ].delete.mutate({
                          session: session(),
                          dueDate: dueDate(),
                          objective: item,
                        });
                        refetchFields();
                      }}
                    >
                      <p>{item}</p>
                    </Editable>
                  </li>
                )}
              </For>
            </ol>

            <AddButton
              onAdd={async (value) => {
                await client.fields[
                  index() === 0 ? "daily" : "technical"
                ].add.mutate({
                  session: session(),
                  dueDate: dueDate(),
                  objective: value,
                });
                refetchFields();
              }}
            />
          </div>
        )}
      </For>

      <For each={objectives()}>
        {([title, items]) => (
          <div class="grid grid-cols-[160px_1fr] items-center my-1">
            <p>
              <strong>{title}</strong>
            </p>
            <div class="text-sm">
              <For each={Array.isArray(items) ? items : [items]}>
                {(objective) => <p>{objective}</p>}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default Objectives;
