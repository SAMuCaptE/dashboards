import { Chart } from "chart.js";
import "chartjs-adapter-moment";

import {
    Component,
    createEffect,
    createResource,
    createSignal,
    Show,
    Suspense
} from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import Loader from "./Loader";

const formatter = new Intl.DateTimeFormat("fr-CA", {
  month: "numeric",
  day: "2-digit",
});

function makeDatasetFromTimeEntries(timeEntries: Record<number, number>) {
  return Object.entries(timeEntries)
    .map(([timestamp, plannedTime]) => ({
      x: parseInt(timestamp),
      y: plannedTime,
    }))
    .sort((a, b) => a.x - b.x)
    .map((record) => ({
      x: new Date(record.x).toISOString(),
      y: record.y / 3600_000,
    }));
}

const BurndownChart: Component<{ sprintId: string }> = (props) => {
  const [burndown] = createResource(async () => {
    const data = await makeRequest("/burndown")
      .get(z.any(), new URLSearchParams({ sprintId: props.sprintId }))
      .catch(() => null);

    return {
      datasets: [
        {
          label: "Prévision",
          type: "line",
          data: makeDatasetFromTimeEntries(data?.plannedCurve ?? {}),
        },
        {
          label: "Réel",
          type: "line",
          data: makeDatasetFromTimeEntries(data?.actualCurve ?? {}),
        },
        {
          label: "Idéal",
          type: "line",
          data: makeDatasetFromTimeEntries(data?.idealCurve ?? {}),
        },
      ],
    };
  });

  const options = {
    scales: {
      x: {
        type: "time",
        ticks: {
          source: "data",
          callback: (value: string) => formatter.format(new Date(value)),
        },
      },
    },
  };

  let chartContainer: HTMLElement | null = null;
  const chart = document.getElementById("burndown") as HTMLCanvasElement;
  const [chartError, setChartError] = createSignal(false);

  createEffect(() => {
    if (burndown()) {
      renderGraph();
    }
  });

  function renderGraph() {
    try {
      setChartError(false);
      const ctx = chart.cloneNode() as HTMLCanvasElement;
      new Chart(ctx, {
        type: "bar",
        data: burndown() as any,
        options: options as any,
      });
      chartContainer?.appendChild(ctx);
      ctx.style.visibility = "visible";
    } catch (err) {
      console.error(err);
      setChartError(true);
    }
  }

  return (
    <div>
      <h4 class="text-center font-semibold">Burndown</h4>
      <Suspense fallback={<Loader />}>
        <div
          class="w-[400px] h-[200px] block relative"
          ref={(ref) => (chartContainer = ref)}
        >
          <Show when={chartError()}>
            <button
              onClick={renderGraph}
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hover:font-bold"
            >
              Essayer à nouveau
            </button>
          </Show>
        </div>
      </Suspense>
    </div>
  );
};

export default BurndownChart;
