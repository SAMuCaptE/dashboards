import { z } from "zod";
import { ColorSchema } from "./color";
import { TaskStatus } from "./task";
import { UserSchema } from "./user";

export const ListSchema = z.object({
  id: z.string(),
  name: z.string(),
  deleted: z.boolean(),
  orderindex: z.number(),
  content: z.string(),
  priority: z.unknown(),
  assignee: UserSchema.nullable(),
  due_date: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  start_date: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  folder: z.object({
    id: z.string(),
    name: z.string(),
    hidden: z.boolean(),
    access: z.boolean(),
  }),
  space: z.object({
    id: z.string(),
    name: z.string(),
    access: z.boolean(),
  }),
  inbound_address: z.string(),
  archived: z.boolean(),
  override_statuses: z.boolean(),
  statuses: z.array(
    z.object({
      id: z.string(),
      status: z
        .string()
        .transform((str) => str.toLowerCase())
        .pipe(TaskStatus),
      orderindex: z.number(),
      color: ColorSchema,
      type: z.enum(["open", "closed", "custom"]),
    })
  ),
  permission_level: z.string(),
});

export type List = z.infer<typeof ListSchema>;
