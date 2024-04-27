import { z } from "zod";
import { Task } from "./task";

export const Epic = Task.and(
  z.object({
    ticketCount: z.number(),
    completedTicketCount: z.number(),
    totalTimePlanned: z.number(),
    totalTimeSpent: z.number(),
    domain: z.string(),
  }),
);

export type Epic = z.infer<typeof Epic>;
