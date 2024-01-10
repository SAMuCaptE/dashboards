import { Component, createResource, For, Show } from "solid-js";
import { client } from "../client";
import { endDate } from "../stores/params";
import { Chip } from "./Chip";

const availableColor = "#999896";
const stripeColor = availableColor + "a0";
const stripeColorFade = availableColor + "60";
const availableStripe = `repeating-linear-gradient(-55deg, ${stripeColor}, ${stripeColor} 10px, ${stripeColorFade} 10px, ${stripeColorFade} 20px)`;

type Categories =
  | keyof Awaited<ReturnType<(typeof client)["budget"]["query"]>>["spent"]
  | "available";

const categories: Record<Categories, { label: string; color: string }> = {
  casing: { label: "Boitier", color: "#ed21dc" },
  composantes: { label: "Pièces", color: "#12a308" },
  communication: { label: "Données", color: "#5fdae8" },
  services: { label: "Services", color: "#faaf37" },
  nature: { label: "Nature", color: "#dbd51a" },
  available: { label: "Disponible", color: availableStripe },
};

const BudgetChart: Component = () => {
  const [budget] = createResource(() => {
    return client.budget.query({ date: endDate().getTime() });
  });

  return (
    <div class="w-full block mx-auto overflow-hidden py-2">
      {
        <div class="w-full flex items-center gap-2">
          <h4 class="font-semibold">Budget</h4>
          <For each={Object.values(categories)}>
            {(category) => (
              <Chip label={category.label} color={category.color} />
            )}
          </For>
        </div>
      }

      <div class="h-5 w-full rounded-md flex overflow-hidden mt-1 items-center">
        <Show when={budget()}>
          <For each={Object.entries(budget()!.spent)}>
            {([category, expense]) => (
              <Expense
                expense={expense}
                category={category as Categories}
                planned={budget()!.planned}
              />
            )}
          </For>

          <Expense
            expense={budget()!.available}
            category={"available"}
            planned={budget()!.planned}
          />
        </Show>
      </div>
    </div>
  );
};

const Expense: Component<{
  category: Categories;
  expense: number;
  planned: number;
}> = (props) => {
  return (
    <div
      class="text-center h-full flex items-center justify-center"
      style={{
        background: categories[props.category].color,
        width: Math.round((100 * props.expense) / props.planned) + "%",
      }}
    >
      <Show when={props.expense >= 200}>
        <span
          class="font-semibold text-white text-sm"
          style={{ "text-shadow": "0px 0px 3px black" }}
        >
          {Math.round(props.expense * 100) / 100}$
        </span>
      </Show>
    </div>
  );
};

export default BudgetChart;
