import { z } from "zod";
import { ColorSchema } from "./color";
import { ShortTaskSchema } from "./task";
import { UserSchema } from "./user";

export const TimeEntrySchema = z.object({
  id: z.string(),
  task: ShortTaskSchema,
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
  task_tags: z.array(
    z.object({
      name: z.string(),
      tag_fg: ColorSchema,
      tag_bg: ColorSchema,
      creator: z.number(),
    })
  ),
  task_url: z.string().url(),
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;
