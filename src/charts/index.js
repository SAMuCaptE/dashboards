export class ChartBuilder {
  datasets = [];

  defaultOptions = {
    bar: {
      scales: { y: { beginAtZero: true, ticks: { display: false } } },
      plugins: {
        datalabels: {
          offset: -5,
          align: "top",
          anchor: "end",
        },
      },
    },
  };

  constructor(canvasId, type) {
    this.canvasId = canvasId;
    this.type = type;
  }

  setLabels(labels) {
    this.labels = labels;
    return this;
  }

  addDataset(dataset) {
    this.datasets.push(dataset);
    return this;
  }

  setLabelFormatter(formatter) {
    this.formatter = formatter;
    return this;
  }

  async render() {
    const selectedOption = this.defaultOptions[this.type];

    return new Chart(document.getElementById(this.canvasId), {
      plugins: [ChartDataLabels],
      type: this.type,
      data: {
        labels: await this.labels,
        datasets: this.datasets,
      },
      options: {
        ...selectedOption,
        plugins: {
          ...selectedOption?.plugins,
          datalabels: {
            ...selectedOption?.plugins.datalabels,
            formatter: this.formatter,
          },
        },
      },
    });
  }
}
