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
