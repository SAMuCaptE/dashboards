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

export const ShortTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.object({
    status: z
      .string()
      .transform((str) => str.toLowerCase())
      .pipe(TaskStatus),
    color: ColorSchema,
    type: z.string(),
    orderindex: z.number(),
  }),
  custom_type: z.string().optional().nullable(),
});

export const TaskSchema = ShortTaskSchema.and(
  z.object({
    orderindex: z.string(),
    date_created: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .or(z.date()),
    date_updated: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .nullable()
      .or(z.date().nullable()),
    date_closed: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .nullable()
      .or(z.date().nullable()),
    date_done: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .nullable()
      .or(z.date().nullable()),
    creator: z.object({
      id: z.number(),
      username: z.string(),
      color: ColorSchema,
      profilePricture: z.string().url().optional(),
    }),
    assignees: z.array(z.unknown()),
    checklists: z.array(z.unknown()),
    tags: z.array(z.unknown()),
    parent: z.unknown().nullable(),
    priority: z.unknown().nullable(),
    due_date: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .or(z.date().nullable()),
    start_date: z
      .string()
      .transform((str) => new Date(parseInt(str)))
      .or(z.date().nullable()),
    time_estimate: z.unknown().nullable(),
    time_spent: z.unknown().nullable(),
    list: z.object({ id: z.string() }),
    folder: z.object({ id: z.string() }),
    space: z.object({ id: z.string() }),
    url: z.string().url(),
  })
);
