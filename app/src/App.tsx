import "chart.js/auto";
import {
    createEffect,
    createResource,
    Show,
    Suspense,
    type Component
} from "solid-js";
import { z } from "zod";

import { makeRequest, rateLimited } from "./client";
import Controls from "./components/Controls";
import Dashboard from "./components/Dashboard";
import ExtraData from "./components/ExtraData";
import Loader from "./components/Loader";
import RateLimited from "./components/RateLimited";
import TimeEntries from "./components/TimeEntries";
import TimeLogger from "./components/TimeLogger";
import { dueDate, session } from "./stores/params";

const App: Component = () => {
  createEffect(() => {
    document.title = `dashboard_${dueDate.replaceAll("-", "_")}`;
  });

  async function handleNewWeek() {
    await makeRequest(`/fields/${session}/${dueDate}`).post(z.any());
    location.reload();
  }

  const [exists] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}`)
      .get(z.any())
      .then(() => ({ success: true, error: null }))
      .catch((error) => ({ success: false, error })),
  );

  return (
    <Show
      when={(rateLimited()?.getTime() ?? 0) + 60_000 < new Date().getTime()}
      fallback={<RateLimited />}
    >
      <aside>
        <Controls />
        <ExtraData />
      </aside>

      <Suspense
        fallback={
          <div class="mx-auto w-fit pt-4">
            <Loader />
          </div>
        }
      >
        <Show
          when={exists()?.success}
          fallback={
            <div class="pt-4">
              <button
                class="w-fit block mx-auto border-black border-2 hover:font-semibold"
                onClick={handleNewWeek}
              >
                Créer le fichier de la semaine
              </button>

              <pre class="w-fit mx-auto pt-4">{exists()?.error.toString()}</pre>
            </div>
          }
        >
          <Dashboard />
        </Show>
      </Suspense>

      <TimeLogger />
      <TimeEntries />
    </Show>
  );
};

export default App;
