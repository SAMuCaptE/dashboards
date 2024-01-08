import { Component, For, Show, createResource, createSignal } from "solid-js";
import { client } from "../client";
import { users } from "../resources/users";

const hourCategories: Array<
  keyof Awaited<
    ReturnType<(typeof client)["extraData"]["query"]>
  >["workedHours"][number]
> = ["unknown", "admin", "mec", "elec", "info", "livrables"];

const ExtraData: Component = () => {
  const [show, setShow] = createSignal(false);
  const [extraData] = createResource(() => client.extraData.query());

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
              <For each={Object.entries(extraData()?.workedHours ?? {})}>
                {([userId, hours]) => (
                  <tr>
                    <td>
                      <span>
                        {
                          users()?.members.find(
                            (user) => user.id === parseInt(userId),
                          )?.username
                        }
                      </span>
                    </td>

                    <For each={hourCategories}>
                      {(category) => (
                        <td class="w-20 text-center">
                          <span>{Math.round(hours[category] * 100) / 100}</span>
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
