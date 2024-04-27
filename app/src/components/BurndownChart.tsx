import "chartjs-adapter-moment";

import { Chart, Colors, Legend, TimeScale, Title, Tooltip } from "chart.js";
import { Line } from "solid-chartjs";
import {
  Component,
  createEffect,
  createResource,
  onMount,
  Show,
  Suspense,
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

  return (
    <div>
      <h4 class="text-center font-semibold">Burndown</h4>
      <Suspense
        fallback={
          <div class="mx-auto w-fit">
            <Loader />
          </div>
        }
      >
        <Show when={burndown()}>
          <ChartWrapper data={burndown()} options={options} />
        </Show>
      </Suspense>
    </div>
  );
};

const ChartWrapper: Component<{ data: any; options: any }> = (props) => {
  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, TimeScale);
  });

  return (
    <Line data={props.data} options={props.options} width={400} height={200} />
  );
};

export default BurndownChart;
