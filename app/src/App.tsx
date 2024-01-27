import { createEffect, createMemo, Show, type Component } from "solid-js";

import { client } from "./client";
import Controls from "./components/Controls";
import Dashboard from "./components/Dashboard";
import ExtraData from "./components/ExtraData";
import TimeEntries from "./components/TimeEntries";
import { fields } from "./resources/fields";
import { dueDate, session } from "./stores/params";

const App: Component = () => {
  createEffect(() => {
    document.title = `dashboard_${dueDate.replaceAll("-", "_")}`;
  });

  const fieldResults = createMemo(fields);
  const f = () => {
    const result = fieldResults();
    if (result?.success) {
      return result.data;
    }
    return null as never;
  };

  function handleNewWeek() {
    client.fields.init.mutate({ session, dueDate });
  }

  return (
    <>
      <aside>
        <Controls />
        <ExtraData />
      </aside>

      <Show
        when={fieldResults()?.success}
        fallback={
          <div class="pt-4">
            <button
              class="w-fit block mx-auto border-black border-2"
              onClick={handleNewWeek}
            >
              Créer le fichier de la semaine
            </button>
            <pre class="w-fit mx-auto">
              {JSON.stringify(fieldResults(), null, 2)}
            </pre>
          </div>
        }
      >
        <Dashboard fields={f} />
        <TimeEntries />
      </Show>
    </>
  );
};

export default App;
