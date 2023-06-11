import type { Component } from "solid-js";

import Controls from "./components/Controls";
import Dashboard from "./components/Dashboard";

const App: Component = () => {
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
