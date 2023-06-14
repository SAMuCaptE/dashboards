import { Chart, Colors, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "solid-chartjs";
import { Component, createMemo, createResource, onMount } from "solid-js";
import { users } from "../resources/users";
import { dueDate, startDate } from "../stores/params";

const fetchWorkedHours = async (): Promise<{ weekly: any; average: any }> => {
  const response = await fetch(
    `http://localhost:16987/hours?start=${startDate().getTime()}&end=${dueDate().getTime()}`
  );
  return response.json();
};

const WorkedHoursChart: Component = () => {
  const [workedHours] = createResource(fetchWorkedHours);

  onMount(() => {
    Chart.register(Title, Tooltip, Legend, Colors);
  });

  const formattedHours = createMemo(() => {
    const names = [];
    const weekly = [];
    const average = [];

    const data = workedHours();
    if (data) {
      const sortedUsers = users().members.sort(
        (m1: any, m2: any) => m1.id - m2.id
      );
      for (const user of sortedUsers) {
        names.push(user.initials);
      }

      for (const a of Object.values(data)) {
        weekly.push(a.weekly);
        average.push(a.average);
      }
    }
    return { names, weekly, average };
  });

  const chartData = () => ({
    labels: formattedHours().names,
    datasets: [
      {
        label: "Travail effectué",
        data: formattedHours().weekly,
        borderWidth: 1,
        barPercentage: 0.6,
      },
      {
        label: "Travail moyen",
        data: formattedHours().average,
        borderWidth: 1,
        barPercentage: 0.6,
      },
    ],
  });

  const chartOptions = {
    scales: { y: { beginAtZero: true, ticks: { display: false } } },
    plugins: {
      datalabels: {
        offset: -5,
        align: "top",
        anchor: "end",
        formatter: (value: number) => Math.round(value * 10) / 10 + "h",
      },
    },
  };

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
