import { z } from "zod";

export const Buget = z.object({
  planned: z.record(z.enum(["s6", "s7", "s8"]), z.number()),
  spent: z.record(
    z.enum(["casing", "pcb", "communication", "services"]),
    z.number()
  ),
  available: z.number(),
});
