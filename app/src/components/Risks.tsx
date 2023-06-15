import { Component, For } from "solid-js";
import { Fields } from "../resources/fields";

const columns = ["Risque", "Mitigation", "Poids", "Ticket"];
const rowClasses =
  "text-center text-sm leading-relaxed flex justify-center items-center";
const iconClasses = "material-symbols-outlined block h-6 text-lg";

const Risks: Component<{ data: Fields }> = (props) => {
  return (
    <ul class="max-h-[200px]">
      <li class="grid grid-cols-[1fr_1fr_50px_45px]">
        <For each={columns}>
          {(title) => <p class="font-semibold text-center">{title}</p>}
        </For>
      </li>
      <For
        each={props.data.risks}
        fallback={
          <li class="italic h-1/2 flex items-center justify-center">
            Aucun risque n'est soulevé pour l'instant
          </li>
        }
      >
        {(risk, index) => (
          <li
            class={`grid grid-cols-[1fr_1fr_50px_45px] ${
              index() % 2 ? "bg-gray-100" : ""
            }`}
          >
            <p class={rowClasses}>{risk.description}</p>
            <p class={rowClasses}>{risk.mitigation}</p>
            <p class={rowClasses}>{risk.gravity}</p>
            <p class={rowClasses}>
              {risk.ticketUrl ? (
                <a href={risk.ticketUrl} target="_blank" class="relative">
                  <span
                    class={`${iconClasses} hover:font-semibold -translate-y-[2px]`}
                  >
                    open_in_new
                  </span>
                </a>
              ) : (
                <span class={iconClasses}>horizontal_rule</span>
              )}
            </p>
          </li>
        )}
      </For>
    </ul>
  );
};

export default Risks;
