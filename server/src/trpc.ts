import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { z } from "zod";

import { getBurndown } from "./api/burndown";
import { EpicSchema, getEpics } from "./api/epics";
import { getExtraData } from "./api/extraData";
import {
    ProblemSchema,
    SelectedDashboard,
    Session,
    findField,
    makeFieldsRouter,
} from "./api/fields";
import { getBudget } from "./api/money";
import { getTasks } from "./api/tasks";
import { getTimeEntriesInRange } from "./api/time-entries";
import { getUsers } from "./api/users";
import { getWorkedHours } from "./api/worked-hours";
import { TaskSchema } from "./schemas/task";
import { TimeEntrySchema } from "./schemas/time-entry";
import { User } from "./schemas/user";

const t = initTRPC.create({ transformer: SuperJSON });

const TaskWithProblemSchema = TaskSchema.and(
  z.object({ problems: z.array(ProblemSchema) }),
);
type TaskWithProblem = z.infer<typeof TaskWithProblemSchema>;

export const appRouter = t.router({
  ping: t.procedure.query(() => "pong"),

  users: t.procedure
    .output(z.object({ members: z.array(User) }))
    .query(getUsers),

  hours: t.procedure
    .input(
      z.object({
        start: z.number().transform((num) => new Date(num)),
        end: z.number().transform((num) => new Date(num)),
      }),
    )
    .output(
      z.record(
        z.string().or(z.literal("average")),
        z.record(z.string(), z.number()),
      ),
    )
    .query(({ input }) => getWorkedHours(input.start, input.end)),

  budget: t.procedure
    .input(z.object({ date: z.number().transform((num) => new Date(num)) }))
    .query(getBudget),

  tasks: t.procedure
    .input(
      z
        .object({
          tags: z.array(z.string()).optional(),
          assigneeIds: z.array(z.string()).optional(),
          listIds: z.array(z.string()).optional(),
          spaceIds: z.array(z.string()).optional(),
          associatedWithAnEpic: z.boolean().optional(),
          epicId: z.string().optional(),
        })
        .and(SelectedDashboard),
    )
    .output(z.array(TaskWithProblemSchema))
    .query(async ({ input }) => {
      const [tasks, problems] = await Promise.all([
        getTasks(
          input.tags ?? [],
          input.assigneeIds ?? [],
          input.listIds ?? [],
          input.spaceIds ?? [],
          input.epicId ?? null,
        ),
        findField(input, (fields) => fields.sprint.problems),
      ]);

      const tasksWithProblems: Array<TaskWithProblem> = [];
      for (const task of tasks) {
        tasksWithProblems.push({
          ...task,
          problems: problems.filter((p) => p.taskId === task.id),
        });
      }

      return tasksWithProblems;
    }),

  epics: t.procedure
    .input(
      z.object({
        session: Session,
        sprintId: z.string().optional(),
      }),
    )
    .output(z.array(EpicSchema))
    .query(({ input }) => getEpics(input.session, input.sprintId ?? null)),

  burndown: t.procedure
    .input(z.object({ sprintId: z.string() }))
    .output(z.unknown())
    .query(({ input }) => getBurndown(input.sprintId)),

  fields: makeFieldsRouter(t as any),

  extraData: t.procedure.query(getExtraData),

  timeEntries: t.procedure
    .input(
      z.object({
        start: z.number().transform((num) => new Date(num)),
        end: z.number().transform((num) => new Date(num)),
      }),
    )
    .output(z.array(TimeEntrySchema))
    .query(({ input }) => getTimeEntriesInRange(input.start, input.end)),
});

export type AppRouter = typeof appRouter;
