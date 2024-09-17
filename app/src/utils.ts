export function formatTime(timeInMs: number) {
  const minutes = Math.floor(timeInMs / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours + "h" + (minutes - hours * 60).toString().padStart(2, "0");
}

export const domainIcons = {
  Informatique: "laptop_mac",
  Électrique: "battery_charging_full",
  Mécanique: "manufacturing",
  Livrables: "school",
  Administration: "contract",
  Tous: "arrow_right",
  unknown: "question_mark",
};

export function tagToDomainIcon(tag: { name: string }) {
  switch (tag.name) {
    case "info":
      return domainIcons["Informatique"];
    case "élec":
      return domainIcons["Électrique"];
    case "mec":
      return domainIcons["Mécanique"];
    case "admin":
      return domainIcons["Administration"];
    case "livrables":
      return domainIcons["Livrables"];
    default:
      return domainIcons.unknown;
  }
}

export const colors = {
  admin: "#8077f1",
  mec: "#e65100",
  élec: "#f9be34",
  elec: "#f9be34",
  info: "#e50000",
  livrables: "#2ecd6f",
  unknown: "#d8e65a",
  average: "#ababab",
} as const;

const debounceCallbacks: Record<string, number> = {};
export function debounce(
  key: string,
  callback: Function,
  delay = 250,
): Function {
  clearTimeout(debounceCallbacks[key]);
  const timeout = setTimeout(callback, delay);
  debounceCallbacks[key] = timeout;
  return () => clearTimeout(timeout);
}

export function convertToDateTimeLocalString(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDeltaTime(delta: number, showSeconds = false) {
  const seconds = delta / 1000 + 1;
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const dDisplay = d > 0 ? d + (d == 1 ? " jour " : " jours ") : "";
  const hDisplay = h > 0 ? h + "h " : "";
  const mDisplay = m > 0 ? m + "m " : "";
  const sDisplay = s > 0 && showSeconds ? s + "s " : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}
