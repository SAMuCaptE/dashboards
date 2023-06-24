import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { z } from "zod";

import { getBurndown } from "./api/burndown";
import { getEpics } from "./api/epics";
import { getBudget } from "./api/money";
import { getTasks } from "./api/tasks";
import { getUsers } from "./api/users";
import { getWorkedHours } from "./api/worked-hours";
import { TaskSchema } from "./schemas/task";
import { UserSchema } from "./schemas/user";

const t = initTRPC.create({ transformer: SuperJSON });

export const appRouter = t.router({
  ping: t.procedure.query(() => "pong"),

  users: t.procedure
    .output(z.object({ members: z.array(UserSchema) }))
    .query(getUsers),

  hours: t.procedure
    .input(
      z.object({
        start: z.number().transform((num) => new Date(num)),
        end: z.number().transform((num) => new Date(num)),
      })
    )
    .output(
      z.record(
        z.string().or(z.literal("average")),
        z.record(z.string(), z.number())
      )
    )
    .query(({ input }) => getWorkedHours(input.start, input.end)),

  budget: t.procedure
    .input(z.object({ date: z.number().transform((num) => new Date(num)) }))
    .query(({ input }) => getBudget(input.date)),

  tasks: t.procedure
    .input(
      z.object({
        tags: z.array(z.string()).optional(),
        assigneeIds: z.array(z.string()).optional(),
        listIds: z.array(z.string()).optional(),
        spaceIds: z.array(z.string()).optional(),
        associatedWithAnEpic: z.boolean().optional(),
        epicId: z.string().optional(),
      })
    )
    .output(z.array(TaskSchema))
    .query(({ input }) =>
      getTasks(
        input.tags ?? [],
        input.assigneeIds ?? [],
        input.listIds ?? [],
        input.spaceIds ?? [],
        input.epicId ?? null
      )
    ),

  epics: t.procedure
    .input(
      z.object({
        session: z.enum(["s6", "s7", "s8"]),
        sprintId: z.string().optional(),
      })
    )
    .output(
      z.array(
        TaskSchema.and(
          z.object({
            ticketCount: z.number(),
            completedTicketCount: z.number(),
            totalTimePlanned: z.number(),
            totalTimeSpent: z.number(),
          })
        )
      )
    )
    .query(({ input }) => getEpics(input.session, input.sprintId ?? null)),

  burndown: t.procedure
    .input(z.object({ sprintId: z.string() }))
    .output(z.unknown())
    .query(({ input }) => getBurndown(input.sprintId)),
});

export type AppRouter = typeof appRouter;
