import { ChartBuilder } from "./index.js";

const data = {
  actual: Array(10)
    .fill(null)
    .map((_) => ({
      x: new Date(2023, 5, 1 + Math.round(Math.random() * 7)),
      y: Math.round(Math.random() * 60),
    })),
  estimated: [60, 30],
  ideal: [],
};

const weekdays = ["V", "S", "D", "L", "M", "M", "J"];
const labels = weekdays
  .map((weekday) => [weekday].concat(Array(9).fill("")))
  .flat();

export async function loadData() {}

export default new ChartBuilder("burndown", "line")
  .setLabels(labels)
  .addDataset({
    label: "Effectué",
    data: data.actual,
  })
  .addDataset({
    label: "Estimé",
    data: data.estimated,
    pointRadius: 0,
  })
  .hideLabels();
