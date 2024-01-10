import { z } from "zod";

export const Budget = z.object({
  spent: z.record(
    z.enum(["casing", "pcb", "communication", "services", "nature"]),
    z.number(),
  ),
  available: z.number(),
  planned: z.number(),
});
