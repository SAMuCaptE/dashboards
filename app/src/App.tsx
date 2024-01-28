import {
    createEffect,
    createResource,
    Show,
    Suspense,
    type Component
} from "solid-js";

import { client } from "./client";
import Controls from "./components/Controls";
import Dashboard from "./components/Dashboard";
import ExtraData from "./components/ExtraData";
import Loader from "./components/Loader";
import TimeEntries from "./components/TimeEntries";
import { dueDate, session } from "./stores/params";

const App: Component = () => {
  createEffect(() => {
    document.title = `dashboard_${dueDate.replaceAll("-", "_")}`;
  });

  function handleNewWeek() {
    client.fields.init.mutate({ session, dueDate });
  }

  const [fields] = createResource(() =>
    client.fields.valid
      .query({ dueDate, session })
      .catch((err) => ({ valid: false, error: err as unknown })),
  );

  return (
    <>
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
          when={fields()?.valid}
          fallback={
            <div class="pt-4">
              <button
                class="w-fit block mx-auto border-black border-2"
                onClick={handleNewWeek}
              >
                Créer le fichier de la semaine
              </button>

              <pre class="w-fit mx-auto pt-4">
                {JSON.stringify(fields()?.error, null, 2)}
              </pre>
            </div>
          }
        >
          <Dashboard />
        </Show>
      </Suspense>

      <TimeEntries />
    </>
  );
};

export default App;
