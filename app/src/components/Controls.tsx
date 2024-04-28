import { Component } from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import {
    dueDate,
    isValidDate,
    navigate,
    Session,
    session
} from "../stores/params";

const Controls: Component = () => {
  return (
    <>
      <form class="w-80 grid my-0 mx-auto grid-cols-2">
        <label for="session-input">Session:</label>
        <select
          id="session-input"
          value={session}
          onchange={(e) => {
            navigate(dueDate, e.currentTarget.value as Session);
          }}
        >
          <option value="s6">s6</option>
          <option value="s7">s7</option>
          <option value="t5">t5</option>
          <option value="s8">s8</option>
        </select>

        <label for="dashboard-date">Date de remise:</label>
        <input
          id="dashboard-date"
          type="date"
          value={dueDate}
          onchange={(e) => {
            navigate(e.currentTarget.value, session);
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
          title="clear cache and reload"
          class="block bg-transparent border-0 mx-auto my-0"
          onclick={async () => {
            await makeRequest("/cache").delete(z.any());
            location.reload();
          }}
        >
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </div>

      {!isValidDate() && (
        <p class="font-bold text-red-600 text-center">
          La date choisie n'est pas un lundi
        </p>
      )}
    </>
  );
};

export default Controls;
