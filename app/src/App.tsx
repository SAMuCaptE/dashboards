import { createEffect, type Component } from "solid-js";

import Controls from "./components/Controls";
import Dashboard from "./components/Dashboard";
import { dueDate } from "./stores/params";

const App: Component = () => {
  createEffect(() => {
    document.title = `dashboard_${dueDate()
      .toLocaleDateString("en-CA")
      .replaceAll("-", "_")}`;
  });

  return (
    <>
      <aside>
        <Controls />
      </aside>
      <Dashboard />
    </>
  );
};

export default App;
