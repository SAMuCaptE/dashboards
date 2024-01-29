export function getBudget(date: Date) {
  const planned = 5613.98;
  const spent = {
    casing: 153.77,
    composantes: 270.96 + 144.65,
    communication: 0,
    services: 0,
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
