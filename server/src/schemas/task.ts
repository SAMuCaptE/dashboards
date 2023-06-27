import { z } from "zod";
import { ColorSchema } from "./color";
import { UserSchema } from "./user";

export const TaskStatus = z.enum([
  "open",
  "to do",
  "in progress",
  "review",
  "blocked",
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
      profilePicture: z.string().url().nullable(),
    }),
    assignees: z
      .array(UserSchema)
      .transform((users) => users.filter((user) => user.initials !== "JG")),
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
    time_estimate: z.number().optional().nullable(),
    custom_fields: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
        type_config: z.unknown(),
        date_created: z
          .string()
          .transform((str) => new Date(parseInt(str)))
          .or(z.date()),
        hide_from_guests: z.boolean(),
        required: z.boolean(),
      })
    ),
    time_spent: z.number().optional().nullable(),
    list: z.object({ id: z.string() }),
    folder: z.object({ id: z.string() }),
    space: z.object({ id: z.string() }),
    url: z.string().url(),
  })
);

export type Task = z.infer<typeof TaskSchema>;
