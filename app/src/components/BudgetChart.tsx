import { Component, createResource, For, Show } from "solid-js";
import { client } from "../client";
import { endDate } from "../stores/params";
import { Chip } from "./Chip";

const availableColor = "#999896";
const stripeColor = availableColor + "a0";
const stripeColorFade = availableColor + "60";
const availableStripe = `repeating-linear-gradient(-55deg, ${stripeColor}, ${stripeColor} 10px, ${stripeColorFade} 10px, ${stripeColorFade} 20px)`;

const categories: Array<{ label: string; color: string }> = [
  { label: "Boitier", color: "#ed21dc" },
  { label: "Pièces", color: "#12a308" },
  { label: "Données", color: "#5fdae8" },
  { label: "Services", color: "#faaf37" },
  { label: "Nature", color: "#dbd51a" },
  { label: "Disponible", color: availableStripe },
];

const BudgetChart: Component = () => {
  const [budget] = createResource(() => {
    return client.budget.query({ date: endDate().getTime() });
  });

  return (
    <div class="w-full block mx-auto overflow-hidden py-2">
      {
        <div class="w-full flex items-center gap-2">
          <h4 class="font-semibold">Budget</h4>
          <For each={categories}>
            {(category) => (
              <Chip label={category.label} color={category.color} />
            )}
          </For>
        </div>
      }

      <div class="h-5 w-full rounded-md flex overflow-hidden mt-1 items-center">
        <Show when={budget()}>
          <For each={[...Object.values(budget()!.spent), budget()!.available]}>
            {(expense, index) => (
              <div
                class="text-center h-full flex items-center justify-center"
                style={{
                  background: categories[index()].color,
                  width: Math.round((100 * expense) / budget()!.planned) + "%",
                }}
              >
                <Show when={expense >= 200}>
                  <span
                    class="font-semibold text-white text-sm"
                    style={{ "text-shadow": "0px 0px 3px black" }}
                  >
                    {Math.round(expense * 100) / 100}$
                  </span>
                </Show>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};

export default BudgetChart;
