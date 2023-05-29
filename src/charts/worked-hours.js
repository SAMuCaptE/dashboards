import { ChartBuilder } from "./index.js";

export default new ChartBuilder("worked-hours", "bar")
  .setLabels([
    "Ariel",
    "Dnaiel",
    "Julien",
    "Mede",
    "Nata",
    "raph",
    "simon",
    "zach",
  ])
  .addDataset({
    label: "Travail effectué",
    data: [12, 19, 3, 5, 2, 3, 5, 10],
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .addDataset({
    label: "Travail moyen",
    data: [10, 11, 13, 25, 12, 9, 20, 13],
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .setLabelFormatter((value) => value + "h");
