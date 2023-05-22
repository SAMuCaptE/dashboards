let session = "";
let date = "";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });

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
    const responses = await Promise.all([fetch(`./sources/${session}/${date}/data.json`), fetch(`./src/defaults.json`)]);
    const [selectedData, defaults] = await Promise.all(responses.map((response) => response.json()));
    const data = { ...defaults, ...selectedData };

    const [year, month, day] = date.split("-").map((v) => parseInt(v));
    const dateEnd = new Date(year, month - 1, day, 0, 0, 0);
    const dateStart = new Date(dateEnd.getTime() - 6 * 24 * 3600 * 1000);
    update(data, dateStart, dateEnd);
  } catch {
    errorElement.innerText = `'${session}' et '${date}' ne sont pas des arguments valides.`;
  }
};

document.querySelectorAll("input,select").forEach((input) => {
  onValueChange({ target: input });
  input.addEventListener("change", onValueChange);
});

function update(data, dateStart, dateEnd) {
  try {
    const container = document.querySelector("main");
    container.innerHTML = container.innerHTML.replace("{{dateStart}}", dateFormatter.format(dateStart));
    container.innerHTML = container.innerHTML.replace("{{dateEnd}}", dateFormatter.format(dateEnd));

    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        const element = document.querySelector(`[t="${key}.[]"]`);
        let originalHtml = element.innerHTML;
        element.innerHTML = "";

        for (const generationData of data[key]) {
          element.innerHTML += originalHtml;
          for (const subkey of Object.keys(generationData)) {
            element.innerHTML = element.innerHTML.replace(`{{${subkey}}}`, generationData[subkey]);
          }
        }
      } else {
        container.innerHTML = container.innerHTML.replace(`{{${key}}}`, data[key]);
      }
    }
  } catch (err) {
    alert(err.message);
  }
}
