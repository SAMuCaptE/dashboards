export function getBudget() {
  const planned = 6080.6;
  const spent = {
    mec: 870.1,
    élec: 298.5,
    info: 999.96,
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
