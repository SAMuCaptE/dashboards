export function getBudget(args: { date: Date }) {
  return {
    planned: {
      s6: 1000,
      s7: 3000,
      s8: 1000,
    },
    spent: {
      casing: 500,
      pcb: 200,
      communication: 75,
      services: 100,
    },
    available: 5000 - 875,
  };
}
