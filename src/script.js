import { flatten } from "./utils.js";

let session = "";
let date = "";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });

document.addEventListener("DOMContentLoaded", () => {
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
});

const onValueChange = async (e) => {
  const value = e.target.value;
  if (/s[678]/.test(value)) {
    session = value;
  } else if (new Date(value)) {
    date = value;
  }

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
    const data = { ...defaults, ...selectedData };
    const flatData = flatten(data);

    const [year, month, day] = date.split("-").map((v) => parseInt(v));
    const dateEnd = new Date(year, month - 1, day, 0, 0, 0);
    const dateStart = new Date(dateEnd.getTime() - 6 * 24 * 3600 * 1000);
    update(flatData, dateStart, dateEnd);
  } catch {
    errorElement.innerText = `'${session}' et '${date}' ne sont pas des arguments valides.`;
  }
};

function update(data, dateStart, dateEnd) {
  try {
    const containers = document.querySelectorAll("main");
    const footer = document.querySelector("footer");

    for (const container of containers) {
      if (!container.querySelector("footer")) {
        container.appendChild(footer);
      }

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
}
