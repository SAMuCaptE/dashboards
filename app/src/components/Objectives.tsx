import { Component, For } from "solid-js";

import { Fields } from "../stores/fields";
import { session } from "../stores/params";

const Objectives: Component<{ data: Fields }> = (props) => {
  const columns = [
    "Ordre du jour",
    "Plan technique",
    "Objectifs du sprint",
    "Objectif de la session",
  ];

  return (
    <div class="w-100 mx-auto">
      <div class="grid grid-cols-4 text-center">
        {columns.map((title) => (
          <p>
            <strong>{title}</strong>
          </p>
        ))}
      </div>

      <div class="grid grid-cols-4 text-center">
        <ol class="justify-center list-decimal list-inside text-sm">
          <For each={props.data.meeting.agenda.items}>
            {(item) => <li>{item}</li>}
          </For>
        </ol>
        <ol class="justify-center list-decimal list-inside text-sm">
          <For each={props.data.meeting.technical.items}>
            {(item) => <li>{item}</li>}
          </For>
        </ol>
        <p class="flex items-center text-sm">{props.data.objective}</p>
        <p class="flex items-center text-sm">
          {props.data.sessions[session()]?.objective}
        </p>
      </div>
    </div>
  );
};

export default Objectives;
