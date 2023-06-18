import { z } from "zod";
import { ColorSchema } from "./color";
import { TaskStatus } from "./task";

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: ColorSchema.nullable(),
  private: z.boolean(),
  avatar: z.null(),
  admin_can_manage: z.boolean().nullable(),
  statuses: z.array(
    z.object({
      id: z.string(),
      status: z
        .string()
        .transform((str) => str.toLowerCase())
        .pipe(TaskStatus),
      type: z.enum(["open", "closed", "custom"]),
      orderindex: z.number(),
      color: ColorSchema,
    })
  ),
  multiple_assignees: z.boolean(),
  features: z.object({
    due_dates: z.object({
      enabled: z.boolean(),
      start_date: z.boolean(),
      remap_due_dates: z.boolean(),
      remap_closed_due_date: z.boolean(),
    }),
    sprints: z.object({ enabled: z.boolean() }),
    time_tracking: z.object({
      enabled: z.boolean(),
      harvest: z.boolean(),
      rollup: z.boolean(),
    }),
    points: z.object({ enabled: z.boolean() }),
    custom_items: z.object({ enabled: z.boolean() }),
    priorities: z.object({
      enabled: z.boolean(),
      priorities: z.array(
        z.object({
          color: ColorSchema,
          id: z.string(),
          orderindex: z.string().transform((str) => parseInt(str)),
          priority: z.enum(["urgent", "high", "normal", "low"]),
        })
      ),
    }),
    tags: z.object({ enabled: z.boolean() }),
    check_unresolved: z.object({
      enabled: z.boolean(),
      subtasks: z.boolean().nullable(),
      checklists: z.boolean().nullable(),
      comments: z.null(),
    }),
    zoom: z.object({ enabled: z.boolean() }),
    milestones: z.object({ enabled: z.boolean() }),
    custom_fields: z.object({ enabled: z.boolean() }),
    status_pies: z.object({ enabled: z.boolean() }),
    multiple_assignees: z.object({ enabled: z.boolean() }),
  }),
  archived: z.boolean(),
});
