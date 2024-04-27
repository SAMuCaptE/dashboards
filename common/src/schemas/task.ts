import { z } from "zod";
import { Color } from "./color";
import { User } from "./user";

export const TaskStatus = z.enum([
  "open",
  "to do",
  "in progress",
  "review",
  "blocked",
  "complete",
  "closed",
  "shipping",
  "cancelled",
]);

export const ShortTask = z.object({
  id: z.string(),
  name: z.string(),
  status: z.object({
    status: z
      .string()
      .transform((str) => str.toLowerCase())
      .pipe(TaskStatus),
    color: Color,
    type: z.string(),
    orderindex: z.number(),
  }),
  custom_type: z.string().optional().nullable(),
});

export const Task = ShortTask.and(
  z.object({
    orderindex: z.string(),
    date_created: z.coerce
      .date()
      .or(z.string().transform((str) => new Date(parseInt(str)))),
    date_closed: z.coerce
      .date()
      .nullable()
      .or(
        z
          .string()
          .transform((str) => new Date(parseInt(str)))
          .nullable(),
      ),
    date_done: z.coerce
      .date()
      .nullable()
      .or(
        z
          .string()
          .transform((str) => new Date(parseInt(str)))
          .nullable(),
      ),
    creator: z.object({
      id: z.number(),
      username: z.string(),
      color: Color,
      profilePicture: z.string().url().nullable(),
    }),
    assignees: z
      .array(User)
      .transform((users) => users.filter((user) => user.initials !== "JG")),
    checklists: z.array(z.unknown()),
    tags: z.array(z.object({ name: z.string(), tag_fg: z.string() })),
    parent: z.string().nullable(),
    priority: z.unknown().nullable(),
    due_date: z.coerce
      .date()
      .nullable()
      .or(z.string().transform((str) => new Date(parseInt(str)))),
    start_date: z.coerce
      .date()
      .nullable()
      .or(z.string().transform((str) => new Date(parseInt(str)))),
    time_estimate: z.number().optional().nullable(),
    custom_fields: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        type: z.string(),
        type_config: z.unknown(),
        date_created: z.coerce
          .date()
          .or(z.string().transform((str) => new Date(parseInt(str)))),
        hide_from_guests: z.boolean(),
        required: z.boolean(),
      }),
    ),
    time_spent: z.number().optional().nullable(),
    list: z.object({ id: z.string() }),
    folder: z.object({ id: z.string() }),
    space: z.object({ id: z.string() }),
    url: z.string().url(),
  }),
);

export type Task = z.infer<typeof Task>;
