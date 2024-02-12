export function getBudget(date: Date) {
  const planned = 6080.6;
  const spent = {
    mec: 588.38,
    élec: 298.5,
    info: 1625.25-1480.6,
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
