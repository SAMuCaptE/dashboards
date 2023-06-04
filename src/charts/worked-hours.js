import { ChartBuilder } from "./index.js";

const names = [];
const weekly = [];
const average = [];

export async function loadData(startDate, endDate) {
  const usersResponse = fetch("http://localhost:16987/users");
  const hoursResponse = fetch(
    `http://localhost:16987/hours?start=${startDate.getTime()}&end=${endDate.getTime()}`
  );
  const resolvedPromises = await Promise.all([usersResponse, hoursResponse]);
  const [users, hours] = await Promise.all(
    resolvedPromises.map((promise) => promise.json())
  );

  names.length = 0;
  weekly.length = 0;
  average.length = 0;

  const sortedUsers = users.members.sort((m1, m2) => m1.id - m2.id);
  for (const user of sortedUsers) {
    names.push(user.initials);
  }

  for (const workedHours of Object.values(hours)) {
    weekly.push(workedHours.weekly);
    average.push(workedHours.average);
  }
}

export default new ChartBuilder("worked-hours", "bar")
  .setLabels(names)
  .addDataset({
    label: "Travail effectué",
    data: weekly,
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .addDataset({
    label: "Travail moyen",
    data: average,
    borderWidth: 1,
    barPercentage: 0.6,
  })
  .setLabelFormatter((value) => Math.round(value * 10) / 10 + "h");
