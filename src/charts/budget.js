import { ChartBuilder } from "./index.js";

const data = {
  planned: {
    s6: 1000,
    s7: 3000,
    s8: 1000,
  },
  spent: {
    casing: 500,
    pcb: 200,
    communication: 75,
    services: 100,
  },
  available: 5000 - 875,
};

export async function loadData() {}

export default new ChartBuilder("budget", "doughnut")
  .setLabels(["Boitier", "PCB", "Données", "Services", "Disponible"])
  .addDataset({
    label: "Dépenses",
    data: [...Object.values(data.spent), data.available],
    backgroundColor: ["#ed21dc", "#12a308", "#5fdae8", "#faaf37", "#99989610"],
    hoverOffset: 4,
    weight: 4,
    borderWidth: 1,
    borderColor: "#30303030",
  })
  .addDataset({
    label: "Planification",
    data: Object.values(data.planned),
    backgroundColor: ["#a6fff0", "#dfbaff", "#b6aafa"],
    hoverOffset: 4,
    weight: 3,
  })
  .setLabelFormatter((label, { dataIndex, datasetIndex }) => {
    if (datasetIndex === 1) {
      return `S${dataIndex + 6}`;
    }
    return parseInt(label) >= 100 ? label : "";
  });
