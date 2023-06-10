import { z } from "zod";
import { Task } from "./task";
import { UserSchema } from "./user";

export const TimeEntrySchema = z.object({
  id: z.string(),
  task: Task,
  wid: z.string(),
  user: UserSchema,
  billable: z.boolean(),
  start: z.string().transform((str) => parseInt(str)),
  end: z.string().transform((str) => parseInt(str)),
  duration: z.string().transform((str) => parseInt(str)),
  description: z.string(),
  tags: z.array(z.string()),
  source: z.literal("clickup").or(z.literal("clickup_mobile")),
  at: z.string().transform((str) => parseInt(str)),
  task_location: z.object({
    list_id: z.string(),
    folder_id: z.string(),
    space_id: z.string(),
  }),
  task_url: z.string().url(),
});
