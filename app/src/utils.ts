export function formatTime(timeInMs: number) {
  const minutes = Math.floor(timeInMs / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours + "h" + (minutes - hours * 60).toString().padStart(2, "0");
}
