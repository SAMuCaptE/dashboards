export function getBudget(date: Date) {
  const planned = 4000;
  const spent = {
    casing: 188.71,
    composantes: 144.65,
    communication: 0,
    services: 0,
    nature: 0,
  };

  const available =
    planned -
    Object.keys(spent).reduce(
      (total, key) => total + spent[key as keyof typeof spent],
      0,
    );

  return { planned, spent, available };
}
