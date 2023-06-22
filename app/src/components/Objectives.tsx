import { Component, For } from "solid-js";

import { Fields } from "../resources/fields";
import { session } from "../stores/params";

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
        {([title, items]) => (
          <div class="grid grid-cols-[120px_1fr] items-center my-1">
            <p>
              <strong>{title}</strong>
            </p>
            <ol class="flex border-gray-300 border-2 rounded-full w-fit">
              <For each={items}>
                {(item) => (
                  <li class="px-3 py-1 text-sm border-r-2 border-gray-300 last:border-r-0">
                    <p>{item}</p>
                  </li>
                )}
              </For>
            </ol>
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
