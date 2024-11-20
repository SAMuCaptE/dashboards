export function getBudget() {
  const planned = 6280.6;
  const spent = {
    mec: 907.44,
    élec: 1700.75,
    info: 1171.25,
    mega: 280.18,
    nature: 1480.6,
  };

  const available =
    planned -
    Object.keys(spent).reduce(
      (total, key) => total + spent[key as keyof typeof spent],
      0,
    );

  return { planned, spent, available };
}
