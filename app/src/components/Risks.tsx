import { Risk } from "common";
import {
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Suspense,
} from "solid-js";
import { Portal } from "solid-js/web";
import { z } from "zod";
import { makeRequest } from "../client";
import { dueDate, session } from "../stores/params";
import AddButton from "./AddButton";
import Editable from "./Editable";
import Loader from "./Loader";

type Fields = any;

const columns = ["Risque", "Mitigation", "Poids", "Ticket"];
const rowClasses =
  "text-center text-sm leading-relaxed flex justify-center items-center";
const iconClasses = "material-symbols-outlined block h-6 text-lg";

const Risks: Component = () => {
  const [risks, { refetch }] = createResource(async () => {
    const data = await makeRequest(`/fields/${session}/${dueDate}/risks`)
      .get(z.array(Risk))
      .catch(() => []);
    return data.sort((a, b) => (a.gravity < b.gravity ? 1 : -1));
  });

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
      await makeRequest(`/fields/${session}/${dueDate}/risks`).put(
        z.any(),
        updatedRisk,
      );
    } else {
      await makeRequest(`/fields/${session}/${dueDate}/risks`).post(z.any(), {
        original: originalRisk,
        updated: updatedRisk,
      });
    }

    await refetch();
  };

  return (
    <>
      {selectedRisk() && (
        <Portal>
          <div
            class="fixed top-0 left-0 w-[100vw] h-[100vh] bg-black bg-opacity-60 z-40"
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

      <Suspense
        fallback={
          <div class="mx-auto w-fit h-[200px]">
            <Loader />
          </div>
        }
      >
        <ul class="max-h-[200px]">
          <li class="grid grid-cols-[1fr_1fr_50px_45px]">
            <For each={columns}>
              {(title) => <p class="font-semibold text-center">{title}</p>}
            </For>
          </li>
          <For
            each={risks()}
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
                    await makeRequest(
                      `/fields/${session}/${dueDate}/risks`,
                    ).delete(z.any(), risk);
                    await refetch();
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
      </Suspense>
    </>
  );
};

export default Risks;
