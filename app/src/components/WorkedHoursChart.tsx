import { Chart, Colors, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "solid-chartjs";
import { Component, createMemo, createResource, onMount } from "solid-js";
import { client } from "../client";
import { users } from "../resources/users";
import { endDate, startDate } from "../stores/params";

const alternateLabels: Record<string, string> = {
  Administration: "Admin",
  Mécanique: "Mec",
  Électrique: "Élec",
  Informatique: "Info",
};

const WorkedHoursChart: Component = () => {
  const [workedHours] = createResource(() =>
    client.hours.query({
      start: startDate().getTime(),
      end: endDate().getTime(),
    })
  );

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors);
  });

  const sortedUsers = createMemo(() =>
    (users()?.members ?? []).sort((a, b) =>
      a.username.split(" ")[1].localeCompare(b.username.split(" ")[1])
    )
  );

  const sortedHours = createMemo(() => {
    const sorted: Record<string, number[]> = {};
    const hours = workedHours() ?? {};
    for (const user of sortedUsers()) {
      for (const key of Object.keys(hours)) {
        sorted[key] ??= [];
        sorted[key].push(hours[key][user.id] ?? 0);
      }
    }
    return sorted;
  });

  const weeklyTotal = () => {
    const hours = Object.entries(sortedHours())
      .filter(([key]) => key !== "average")
      .map(([_, values]) => values) as number[][];

    const totals: number[] = [];
    for (const hour of hours) {
      for (let i = 0; i < sortedUsers().length; i++) {
        totals[i] ??= 0;
        totals[i] += hour[i];
      }
    }
    return totals;
  };

  const chartData = () => ({
    labels: sortedUsers().map((user) => user.initials),
    datasets: [
      ...Object.entries(sortedHours())
        .filter(([label]) => label !== "average")
        .map(([label, data]) => ({
          data,
          type: "bar",
          label: alternateLabels[label] ?? label,
          borderWidth: 1,
          barPercentage: 0.6,
        })),
      {
        type: "line",
        label: "Moyenne",
        data: sortedHours().average,
      },
    ],
  });

  const chartOptions = {
    scales: {
      y: { beginAtZero: true, ticks: { display: false }, stacked: true },
      x: { stacked: true },
    },
    plugins: {
      datalabels: {
        offset: -5,
        align: "top",
        anchor: "end",
        formatter: (
          value: number,
          metadata: { datasetIndex: number; dataIndex: number }
        ) => {
          if (metadata.datasetIndex === 3) {
            // 3 == dernier
            return (
              Math.round(weeklyTotal()[metadata.dataIndex] * 10) / 10 + "h"
            );
          } else if (metadata.datasetIndex === 4) {
            // 4 == average
            return weeklyTotal()[metadata.dataIndex] - value > 2
              ? Math.round(value * 10) / 10 + "h"
              : "";
          }
          return "";
        },
      },
      legend: { labels: { usePointStyle: true } },
    },
  } as const;

  return (
    <div>
      <Bar
        data={chartData()}
        options={chartOptions}
        plugins={[ChartDataLabels]}
        width={400}
        height={200}
      />
    </div>
  );
};

export default WorkedHoursChart;
