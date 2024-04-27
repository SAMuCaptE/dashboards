import { z } from "zod";
import { ColorSchema } from "./color";
import { TaskStatus } from "./task";
import { User } from "./user";

export const EpicListSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z
    .string()
    .transform((str) => str.toLowerCase())
    .pipe(TaskStatus),
  orderindex: z.number(),
  color: ColorSchema,
  type: z.enum(["open", "closed", "custom", "done"]),
  date_created: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  date_updated: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  date_closed: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  date_done: z
    .string()
    .transform((str) => new Date(parseInt(str)))
    .or(z.date())
    .nullable(),
  creator: z.any(),
  assignees: z.array(z.unknown()),
  checklists: z.unknown(),
  tags: z.array(z.unknown()),
  parent: z.unknown().nullable(),
  priority: z.unknown().nullable(),
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
  time_estimate: z.unknown().nullable(),
  custom_fields: z.array(z.unknown()),
  list: z.object({
    id: z.string(),
  }),
  folder: z.object({
    id: z.string(),
  }),
  space: z.object({
    id: z.string(),
  }),
  url: z.string(),
});

export const ListSchema = z.object({
  id: z.string(),
  name: z.string(),
  deleted: z.boolean(),
  orderindex: z.number(),
  content: z.string(),
  priority: z.unknown(),
  assignee: User.nullable(),
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
      type: z.enum(["open", "closed", "custom", "done"]),
    }),
  ),
  permission_level: z.string(),
});

export type List = z.infer<typeof ListSchema>;
export type EpicList = z.infer<typeof EpicListSchema>;
