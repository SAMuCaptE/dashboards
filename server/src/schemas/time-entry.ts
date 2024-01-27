import { z } from "zod";
import { ColorSchema } from "./color";
import { ShortTaskSchema } from "./task";
import { UserSchema } from "./user";

const StrToNum = z.union([
  z.string().transform((str) => parseInt(str)),
  z.number(),
]);

export const TimeEntrySchema = z.object({
  id: z.string(),
  task: ShortTaskSchema,
  wid: z.string(),
  user: UserSchema,
  billable: z.boolean(),
  start: StrToNum,
  end: StrToNum,
  duration: StrToNum,
  description: z.string(),
  tags: z.array(z.string()),
  source: z.enum(["clickup", "clickup_mobile", "clickup_automatic"]),
  at: StrToNum,
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
    }),
  ),
  task_url: z.string().url(),
});

export type TimeEntry = z.infer<typeof TimeEntrySchema>;
