import { Component, For, Show, createResource, createSignal } from "solid-js";
import { client } from "../client";
import { users } from "../resources/users";

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
          <ul>
            <For each={Object.entries(extraData()?.workedHours ?? {})}>
              {([userId, hours]) => (
                <li class="grid grid-cols-[1fr_110px] hover:font-semibold">
                  <span class="text-right pr-2">
                    {
                      users()?.members.find(
                        (user) => user.id === parseInt(userId)
                      )?.username
                    }{" "}
                    :
                  </span>
                  <span>
                    {Math.floor(hours)}h{" "}
                    {Math.floor((hours - Math.floor(hours)) * 60)}min
                  </span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default ExtraData;
