import budgetChart from "./charts/budget.js";
import workedHoursChart, { loadData } from "./charts/worked-hours.js";
import { flatten, mergeDeep } from "./utils.js";

const charts = [workedHoursChart, budgetChart];

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });
let initialHtml = {};
let session = "";
let date = "";

document.addEventListener("DOMContentLoaded", async () => {
  let requestedDate = window.location.search
    .replace("?", "")
    .split("&")
    .find((str) => /date=.*/.test(str))
    ?.replace("date=", "");

  if (requestedDate === undefined) {
    const thursday = new Date();
    thursday.setDate(thursday.getDate() + ((4 + 7 - thursday.getDay()) % 7));
    requestedDate = thursday.toLocaleDateString("fr-CA");
  }

  document.querySelector("input").value = requestedDate;
  date = requestedDate;

  document.querySelectorAll("input,select").forEach((input) => {
    onValueChange({ target: input });
    input.addEventListener("change", onValueChange);
  });

  document
    .querySelector(".print")
    .addEventListener("click", () => window.print());
});

const onValueChange = async (e) => {
  const value = e.target.value;
  if (/s[678]/.test(value)) {
    session = value;
  } else if (new Date(value)) {
    date = value;
  }

  const [year, month, day] = date.split("-").map((v) => parseInt(v));
  const dateEnd = new Date(year, month - 1, day, 0, 0, 0);
  const dateStart = new Date(dateEnd.getTime() - 6 * 24 * 3600 * 1000);
  dateStart.setHours(0, 0, 0);
  dateEnd.setHours(23, 59, 59);

  await loadData(dateStart, dateEnd);

  const errorElement = document.getElementById("selection-response");
  errorElement.innerText = "";
  try {
    const responses = await Promise.all([
      fetch(`./sources/${session}/${date}/data.json`),
      fetch(`./src/defaults.json`),
    ]);
    const [selectedData, defaults] = await Promise.all(
      responses.map((response) => response.json())
    );
    const data = mergeDeep(defaults, selectedData);
    const flatData = flatten(data);

    update(flatData, dateStart, dateEnd);
  } catch {
    errorElement.innerText = `'${session}' et '${date}' ne sont pas des arguments valides.`;
  }
};

async function update(data, dateStart, dateEnd) {
  try {
    const containers = document.querySelectorAll("main");
    const footer = document.querySelector("footer");

    for (const [index, container] of containers.entries()) {
      if (!initialHtml[index]) {
        if (!container.querySelector("footer")) {
          container.appendChild(footer);
        }
        initialHtml[index] = container.innerHTML;
      }

      container.innerHTML = initialHtml[index];
      container.innerHTML = container.innerHTML.replace(
        "{{dateStart}}",
        dateFormatter.format(dateStart)
      );
      container.innerHTML = container.innerHTML.replace(
        "{{dateEnd}}",
        dateFormatter.format(dateEnd)
      );

      container.innerHTML = container.innerHTML.replaceAll(
        /(s[678])|(\[session\])/g,
        session
      );
      container.innerHTML = container.innerHTML.replaceAll(
        /\[date\]/g,
        dateEnd.toLocaleDateString("fr-CA")
      );

      for (const key of Object.keys(data)) {
        if (Array.isArray(data[key])) {
          const element = document.querySelector(`[t="${key}.[]"]`);
          if (element.childElementCount > 1) {
            continue;
          }

          let originalHtml = element.innerHTML;
          element.innerHTML = "";

          for (const generationData of data[key]) {
            element.innerHTML += originalHtml;
            for (const subkey of Object.keys(generationData)) {
              element.innerHTML = element.innerHTML.replaceAll(
                `{{${subkey}}}`,
                generationData[subkey]
              );
            }
          }
        } else {
          container.innerHTML = container.innerHTML.replaceAll(
            `{{${key}}}`,
            data[key]
          );
        }
      }
    }
  } catch (err) {
    alert(err.message);
  }

  for (const chart of charts) {
    await chart.render();
  }
}
