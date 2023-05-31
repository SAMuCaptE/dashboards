import { ChartBuilder } from "./index.js";

const names = new Promise(async (resolve) => {
  const usersResponse = await fetch("http://localhost:16987/users");
  const { members } = await usersResponse.json();
  resolve(members.map((m) => m.initials));
});

export default new ChartBuilder("worked-hours", "bar")
  .setLabels(names)
  .addDataset({
    label: "Travail effectué",
    data: Array(8)
      .fill(0)
      .map(() => Math.floor(Math.random() * 30)),
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .addDataset({
    label: "Travail moyen",
    data: Array(8)
      .fill(0)
      .map(() => Math.floor(Math.random() * 30)),
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .setLabelFormatter((value) => value + "h");
