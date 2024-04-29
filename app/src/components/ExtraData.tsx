import { Component, createResource, createSignal, For, Show } from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import { users } from "../resources/users";

const hourCategories = [
  "unknown",
  "admin",
  "mec",
  "elec",
  "info",
  "livrables",
] as const;

const ExtraData: Component = () => {
  const [show, setShow] = createSignal(false);

  const [extraData] = createResource(() =>
    makeRequest("/extra").get(
      z.record(z.coerce.number(), z.record(z.enum(hourCategories), z.number())),
    ),
  );

  return (
    <div class="w-fit mx-auto border-2 border-black border-solid px-4">
      <div class="flex justify-center">
        <button
          class="bg-gray-300 hover:font-semibold"
          onclick={() => setShow((prev) => !prev)}
        >
          {show() ? "Cacher données en extra" : "Afficher données en extra"}
        </button>
      </div>

      <Show when={show()}>
        <div class="pt-4 grid">
          <h3 class="font-semibold text-center">
            Heures travaillées par personne
          </h3>

          <table>
            <thead>
              <tr>
                <td></td>
                <For each={hourCategories}>
                  {(title) => (
                    <td class="w-20 text-center font-semibold">
                      <span>{title}</span>
                    </td>
                  )}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={Object.entries(extraData() ?? {})}>
                {([userId, hours]) => (
                  <tr>
                    <td>
                      <span>
                        {
                          users()?.find((user) => user.id === parseInt(userId))
                            ?.username
                        }
                      </span>
                    </td>

                    <For each={hourCategories}>
                      {(category) => (
                        <td class="w-20 text-center">
                          <span>
                            {Math.round((hours[category] ?? 0) * 100) / 100}
                          </span>
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};

export default ExtraData;
