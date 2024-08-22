import { z } from "zod";
import { Color } from "./color";
import { ShortTask } from "./task";
import { User } from "./user";

const StrToNum = z.union([
  z.string().transform((str) => parseInt(str)),
  z.number(),
]);

export const TimeEntry = z.object({
  id: z.string(),
  task: ShortTask,
  wid: z.string(),
  user: User,
  billable: z.boolean(),
  start: StrToNum,
  end: StrToNum,
  duration: StrToNum,
  description: z.string(),
  tags: z.array(z.string()),
  source: z.enum(["clickup", "clickup_mobile", "clickup_automatic", "manual"]),
  at: StrToNum,
  task_location: z.object({
    list_id: z.string(),
    folder_id: z.string(),
    space_id: z.string(),
  }),
  task_tags: z.array(
    z.object({
      name: z.string(),
      tag_fg: Color,
      tag_bg: Color,
      creator: z.number(),
    }),
  ),
  task_url: z.string().url(),
});

export type TimeEntry = z.infer<typeof TimeEntry>;
