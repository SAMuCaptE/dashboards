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
    doughnut: {
      plugins: {
        legend: {
          position: "right",
          labels: {
            usePointStyle: true,
          },
        },
        datalabels: {
          font: { weight: "bold" },
        },
      },
    },
    line: {
      scales: {
        x: {
          type: "time",
          min: new Date(2023, 5, 1),
          max: new Date(2023, 5, 8),
        },
      },
    },
  };

  constructor(canvasId, type) {
    this.showLabels = true;
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

  hideLabels() {
    this.showLabels = false;
    return this;
  }

  async render() {
    const selectedOption = this.defaultOptions[this.type];

    const labels = await this.labels;
    const datasets = await Promise.all(this.datasets);

    return new Chart(document.getElementById(this.canvasId), {
      plugins: this.showLabels ? [ChartDataLabels] : [],
      type: this.type,
      data: { labels, datasets },
      options: {
        ...selectedOption,
        plugins: {
          ...selectedOption?.plugins,
          datalabels: {
            ...selectedOption?.plugins?.datalabels,
            formatter: this.formatter,
          },
        },
      },
    });
  }
}
