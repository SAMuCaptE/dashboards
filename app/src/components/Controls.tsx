import { Component } from "solid-js";
import { fields, refetch as refetchFields } from "../resources/fields";
import { refetch as refetchUsers } from "../resources/users";
import {
  Session,
  dueDate,
  isValidDate,
  session,
  setDueDate,
  setSession,
} from "../stores/params";

const Controls: Component = () => {
  return (
    <>
      <form class="w-80 grid my-0 mx-auto grid-cols-2">
        <label for="session-input">Session:</label>
        <select
          id="session-input"
          value={session()}
          onchange={(e) => {
            setSession(e.currentTarget.value as Session);
            refetchFields();
          }}
        >
          <option value="s6">s6</option>
          <option value="s7">s7</option>
          <option value="s8">s8</option>
        </select>

        <label for="dashboard-date">Date de remise:</label>
        <input
          id="dashboard-date"
          type="date"
          value={dueDate().toLocaleDateString("en-CA")}
          onchange={(e) => {
            const [year, month, day] = e.currentTarget.value
              .split("-")
              .map((v) => parseInt(v));
            setDueDate(new Date(year, month - 1, day));
            refetchFields();
          }}
        />
      </form>

      <div class="flex w-1/6 mx-auto">
        <button
          class="block bg-transparent border-0 mx-auto my-0 "
          onclick={() => window.print()}
        >
          <span class="material-symbols-outlined">print</span>
        </button>

        <button
          class="block bg-transparent border-0 mx-auto my-0 "
          onclick={() => {
            refetchFields();
            refetchUsers();
          }}
        >
          <span class="material-symbols-outlined">update</span>
        </button>
      </div>

      {!isValidDate() && (
        <p class="font-bold text-red-600 text-center">
          La date choisie n'est pas un jeudi
        </p>
      )}
      {!fields()?.success && (
        <pre class="w-fit mx-auto">{JSON.stringify(fields(), null, 2)}</pre>
      )}
    </>
  );
};

export default Controls;
