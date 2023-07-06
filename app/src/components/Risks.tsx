import { Fields } from "dashboards-server";
import {
  Component,
  For,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { client } from "../client";
import { refetch as refetchFields } from "../resources/fields";
import { dueDate, session } from "../stores/params";
import AddButton from "./AddButton";
import Editable from "./Editable";

const columns = ["Risque", "Mitigation", "Poids", "Ticket"];
const rowClasses =
  "text-center text-sm leading-relaxed flex justify-center items-center";
const iconClasses = "material-symbols-outlined block h-6 text-lg";

const Risks: Component<{ data: Fields }> = (props) => {
  const sortedRisks = () =>
    props.data.risks.sort((a, b) => (a.gravity < b.gravity ? 1 : -1));

  let formElement: HTMLFormElement | null = null;
  const [selectedRisk, setSelectedRisk] = createSignal<
    Fields["risks"][number] | null
  >(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedRisk() && e.key === "Escape") {
      formElement?.reset();
    }
  };

  onMount(() => document.addEventListener("keydown", handleKeyDown));
  onCleanup(() => document.removeEventListener("keydown", handleKeyDown));

  createEffect(() => {
    if (selectedRisk()) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const originalRisk = selectedRisk()!;
    setSelectedRisk(null);

    const formData = new FormData(formElement!);
    const updatedRisk = Object.fromEntries(formData) as any;
    updatedRisk["gravity"] = parseInt(updatedRisk["gravity"]);
    updatedRisk["ticketUrl"] = updatedRisk["ticketUrl"] || undefined;

    if (originalRisk.description === "") {
      await client.fields.risks.add.mutate({
        session: session(),
        dueDate: dueDate(),
        risk: updatedRisk,
      });
    } else {
      await client.fields.risks.update.mutate({
        session: session(),
        dueDate: dueDate(),
        originalRisk: originalRisk,
        updatedRisk: updatedRisk,
      });
    }

    refetchFields();
  };

  return (
    <>
      {selectedRisk() && (
        <Portal>
          <div
            class="fixed top-0 left-0 w-[100vw] h-[100vh] bg-black bg-opacity-60"
            onclick={() => formElement?.reset()}
          >
            <form
              ref={(el) => (formElement = el)}
              onsubmit={handleSubmit}
              onreset={() => setSelectedRisk(null)}
              onclick={(e) => e.stopPropagation()}
            >
              <div class="bg-white w-5/6 mx-auto mt-[30%]">
                <div class="text-center">
                  <h4 class="text-lg font-semibold">Ajuster un risque</h4>

                  <div class="grid grid-cols-[100px_1fr] gap-1 px-2">
                    <For
                      each={
                        [
                          "description",
                          "mitigation",
                          "gravity",
                          "ticketUrl",
                        ] as const
                      }
                    >
                      {(riskKey) => (
                        <>
                          <label for={`risk-${riskKey}`}>{riskKey}: </label>
                          <input
                            type="text"
                            name={riskKey}
                            id={`risk-${riskKey}`}
                            class="border-black border-2"
                            value={selectedRisk()![riskKey] ?? ""}
                          />
                        </>
                      )}
                    </For>
                  </div>
                </div>

                <div class="flex justify-center">
                  <button class="px-2 hover:font-semibold" type="reset">
                    Annuler
                  </button>
                  <button class="px-2 hover:font-semibold" type="submit">
                    Soumettre
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Portal>
      )}

      <ul class="max-h-[200px]">
        <li class="grid grid-cols-[1fr_1fr_50px_45px]">
          <For each={columns}>
            {(title) => <p class="font-semibold text-center">{title}</p>}
          </For>
        </li>
        <For
          each={sortedRisks()}
          fallback={
            <li class="italic h-1/2 flex items-center justify-center">
              Aucun risque n'est soulevé pour l'instant
            </li>
          }
        >
          {(risk) => (
            <li class="even:bg-gray-200">
              <Editable
                complexEdit
                class="grid grid-cols-[1fr_1fr_50px_45px]"
                onEdit={() => {
                  setSelectedRisk(risk);
                }}
                onDelete={async () => {
                  await client.fields.risks.delete.mutate({
                    session: session(),
                    dueDate: dueDate(),
                    risk,
                  });
                  refetchFields();
                }}
              >
                <p class={rowClasses}>{risk.description}</p>
                <p class={rowClasses}>{risk.mitigation}</p>
                <p class={rowClasses}>{risk.gravity}</p>
                <p class={rowClasses}>
                  {risk.ticketUrl ? (
                    <a
                      href={risk.ticketUrl}
                      target="_blank"
                      class="relative"
                      onclick={(e) => e.stopPropagation()}
                    >
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
              </Editable>
            </li>
          )}
        </For>
      </ul>

      <AddButton
        complexAdd
        onAdd={() => {
          setSelectedRisk({
            description: "",
            mitigation: "",
            gravity: 1,
            ticketUrl: "",
          });
        }}
      />
    </>
  );
};

export default Risks;
