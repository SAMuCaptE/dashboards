export function getBudget(date: Date) {
  return {
    planned: {
      s6: 500,
      s7: 3000,
      s8: 500,
    },
    spent: {
      casing: 104.97,
      composantes: 144.65,
      communication: 0,
      services: 0,
    },
    available: 4000 - 249.62,
  };
}
