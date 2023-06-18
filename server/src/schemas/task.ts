import { z } from "zod";
import { ColorSchema } from "./color";

export const TaskStatus = z.enum([
  "open",
  "to do",
  "in progress",
  "review",
  "complete",
  "closed",
]);

export const Task = z.object({
  id: z.string(),
  name: z.string(),
  status: z.object({
    status: TaskStatus,
    color: ColorSchema,
    type: z.string(),
    orderindex: z.number(),
  }),
  custom_type: z.string().nullable(),
});
