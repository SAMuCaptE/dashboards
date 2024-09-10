export function getBudget() {
  const planned = 5480.6;
  const spent = {
    mec: 941.26,
    élec: 1195.78,
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
