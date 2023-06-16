import { Chart, Colors, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "solid-chartjs";
import { Component, createResource, onMount } from "solid-js";
import { dueDate } from "../stores/params";

const fetchBudget = async () => {
  const response = await fetch(
    `http://localhost:16987/budget?date=${dueDate().getTime()}`
  );
  return response.json();
};

const BudgetChart: Component = () => {
  const [budget] = createResource(fetchBudget);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors);
  });

  const chartData = () =>
    budget()
      ? {
          labels: ["Boitier", "PCB", "Données", "Services", "Disponible"],
          datasets: [
            {
              label: "Dépenses",
              data: [...Object.values(budget().spent), budget().available],
              backgroundColor: [
                "#ed21dc",
                "#12a308",
                "#5fdae8",
                "#faaf37",
                "#99989610",
              ],
              hoverOffset: 4,
              weight: 4,
              borderWidth: 1,
              borderColor: "#30303030",
            },
            {
              label: "Planification",
              data: Object.values(budget().planned),
              backgroundColor: ["#a6fff0", "#dfbaff", "#b6aafa"],
              hoverOffset: 4,
              weight: 3,
            },
          ],
        }
      : {};

  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { display: false },
        grid: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { display: false },
      },
    },
    plugins: {
      legend: {
        position: "right",
        labels: {
          usePointStyle: true,
        },
      },
      datalabels: {
        font: { weight: "bold" },
        formatter: (
          label: string,
          {
            dataIndex,
            datasetIndex,
          }: { dataIndex: number; datasetIndex: number }
        ) => {
          if (datasetIndex === 1) {
            return `S${dataIndex + 6}`;
          }
          return parseInt(label) >= 100 ? label : "";
        },
      },
    },
  };

  return (
    <div class="w-[350px] h-[260px] block mx-auto overflow-hidden">
      <h4 class="text-center font-semibold">Budget</h4>
      <div class="h-[180px] mt-[40px]">
        <Doughnut
          data={chartData()}
          options={chartOptions}
          plugins={[ChartDataLabels]}
        />
      </div>
    </div>
  );
};

export default BudgetChart;
