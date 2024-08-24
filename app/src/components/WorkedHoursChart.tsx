import { Chart } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Component,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";
import { users } from "../resources/users";
import { endDate, startDate } from "../stores/params";
import { colors } from "../utils";
import Loader from "./Loader";

const alternateLabels: Record<string, string> = {
  admin: "Admin",
  mec: "Mec",
  elec: "Élec",
  info: "Info",
  livrables: "Livrables",
  unknown: "Autre",
};

const WorkedHoursChart: Component = () => {
  const [workedHours] = createResource(() =>
    makeRequest("/hours")
      .get(
        z.record(z.string(), z.record(z.string(), z.number()).or(z.number())),
        new URLSearchParams({
          start: startDate.getTime().toString(),
          end: endDate.getTime().toString(),
        }),
      )
      .then((hours) => {
        const formatted = Object.entries(hours).reduce(
          (acc, [key, value]) =>
            typeof value === "number" ? acc : { ...acc, [key]: value },
          {} as Record<string, Record<string, number>>,
        );
        return [formatted, hours.weekCount as number] as const;
      }),
  );

  const sortedHours = createMemo(() => {
    const sorted: Record<string, number[]> = {};

    const [hours, weekCount] = workedHours() ?? [{}, 1];
    for (const user of users() ?? []) {
      for (const key of Object.keys(hours)) {
        sorted[key] ??= [];
        sorted[key].push(hours[key][user.id] ?? 0) / weekCount;
      }
    }
    return sorted;
  });

  const weeklyTotal = () => {
    const hours = Object.entries(sortedHours())
      .filter(([key]) => key !== "total")
      .map(([_, values]) => values) as number[][];

    const totals: number[] = [];
    for (const hour of hours) {
      for (let i = 0; i < (users() ?? []).length; i++) {
        totals[i] ??= 0;
        totals[i] += hour[i];
      }
    }
    return totals;
  };

  const chartData = () => ({
    labels: (users() ?? []).map((user) => user.initials),
    datasets: [
      ...Object.entries(sortedHours())
        .filter(([label]) => label !== "total")
        .map(([label, data]) => ({
          data,
          type: "bar",
          label: alternateLabels[label] ?? label,
          borderWidth: 1,
          barPercentage: 0.6,
          backgroundColor:
            colors[label as keyof typeof colors] ?? colors.unknown,
        })),
      {
        type: "line",
        label: "Moy",
        data: sortedHours().total.map(
          (total) => total / (workedHours() ?? [{}, 1])[1],
        ),
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
          metadata: { datasetIndex: number; dataIndex: number },
        ) => {
          const datasetCount = Object.keys(workedHours() ?? {}).length;
          if (metadata.datasetIndex === datasetCount - 2) {
            return (
              Math.round(weeklyTotal()[metadata.dataIndex] * 100) / 100 + "h"
            );
          } else if (metadata.datasetIndex === datasetCount - 1) {
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

  const chart = document.getElementById("worked-hours") as HTMLCanvasElement;
  const [chartError, setChartError] = createSignal(false);

  createEffect(() => {
    if (chartData().datasets.length > 1) {
      renderGraph();
    }
  });

  function renderGraph() {
    try {
      setChartError(false);
      new Chart(chart, {
        data: chartData() as any,
        type: "bar",
        options: chartOptions,
        plugins: [ChartDataLabels],
      });
    } catch (err) {
      console.error(err);
      setChartError(true);
    }
  }

  return (
    <div>
      <h4 class="text-center font-semibold">Répartition du travail</h4>
      <Suspense fallback={<Loader />}>
        <div
          class="w-[410px] h-[206px] block relative"
          ref={(ref) => {
            const backupNode = chart.cloneNode();
            chart.parentNode?.insertBefore(backupNode, chart);
            ref.appendChild(chart);
            chart.style.visibility = "visible";
          }}
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

export default WorkedHoursChart;
