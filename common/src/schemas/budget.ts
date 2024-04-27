import { z } from "zod";

export const Budget = z.object({
  spent: z.record(
    z.enum(["info", "élec", "mec", "nature"]),
    z.number(),
  ),
  available: z.number(),
  planned: z.number(),
});
