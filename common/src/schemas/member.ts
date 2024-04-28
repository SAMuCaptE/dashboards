import { z } from "zod";

export const Member = z.object({
  img: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  role: z.string(),
  disponibility: z.object({
    lastWeek: z.number().min(1).max(6),
    nextWeek: z.number().min(1).max(6),
  }),
});

export type Member = z.infer<typeof Member>;
