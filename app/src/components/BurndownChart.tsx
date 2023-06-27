import "chartjs-adapter-moment";

import { Chart, Colors, Legend, TimeScale, Title, Tooltip } from "chart.js";
import { Line } from "solid-chartjs";
import { Component, createResource, onMount } from "solid-js";
import { client } from "../client";
import { Fields } from "../resources/fields";

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

const BurndownChart: Component<{ data: Fields }> = (props) => {
  const [burndown] = createResource(() =>
    client.burndown.query({ sprintId: props.data.sprint.id })
  );

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors, TimeScale);
  });

  const data = () => ({
    datasets: [
      {
        label: "Prévision",
        type: "line",
        data: makeDatasetFromTimeEntries(burndown()?.plannedCurve ?? {}),
      },
      {
        label: "Réel",
        type: "line",
        data: makeDatasetFromTimeEntries(burndown()?.actualCurve ?? {}),
      },
      {
        label: "Idéal",
        type: "line",
        data: makeDatasetFromTimeEntries(burndown()?.idealCurve ?? {}),
      },
    ],
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
      <Line data={data()} options={options} width={400} height={200} />
    </div>
  );
};

export default BurndownChart;
