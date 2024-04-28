import { z } from "zod";

export const Risk = z.object({
  description: z.string(),
  mitigation: z.string(),
  gravity: z.number().min(1),
  ticketUrl: z.string().url().optional().nullable(),
});

export type Risk = z.infer<typeof Risk>;
