import { Chart } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  Component,
  createEffect,
  createMemo,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import { users } from "../resources/users";
import { colors } from "../utils";
import Loader from "./Loader";
import { useTime } from "./TimeContext";

const alternateLabels: Record<string, string> = {
  admin: "Admin",
  mec: "Mec",
  elec: "Élec",
  info: "Info",
  livrables: "Uni",
  unknown: "Autre",
  mega: "Méga",
};

const WorkedHoursChart: Component = () => {
  const time = useTime();

  const sortedHours = createMemo(() => {
    const sorted: Record<string, number[]> = {};

    const [hours, weekCount] = time?.workedHours() ?? [{}, 1];
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
          (total) => total / (time?.workedHours() ?? [{}, 1])[1],
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
          _: number,
          metadata: { datasetIndex: number; dataIndex: number },
        ) => {
          const datasetCount = Object.keys(
            time?.workedHours()?.[0] ?? {},
          ).length;
          if (metadata.datasetIndex === datasetCount - 2) {
            return (
              Math.round(weeklyTotal()[metadata.dataIndex] * 100) / 100 + "h"
            );
          }
          return "";
        },
      },
      legend: {
        labels: {
          usePointStyle: true,
          filter: function (item) {
            return item.text !== "Autre";
          },
        },
      },
    },
  } as const;

  const chart = document.getElementById("worked-hours") as HTMLCanvasElement;
  const [chartError, setChartError] = createSignal(false);

  createEffect(() => {
    if (chartData().datasets.length > 1) {
      renderGraph();
    }
  });

  let chartRef;
  function renderGraph() {
    try {
      setChartError(false);
      chartRef?.destroy();
      chartRef = new Chart(chart, {
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
