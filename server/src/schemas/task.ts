import { z } from "zod";
import { ColorSchema } from "./color";

export const Task = z.object({
  id: z.string(),
  name: z.string(),
  status: z.object({
    status: z.enum([
      "open",
      "to do",
      "in progress",
      "review",
      "complete",
      "closed",
    ]),
    color: ColorSchema,
    type: z.string(),
    orderindex: z.number(),
  }),
  custom_type: z.string().nullable(),
});
