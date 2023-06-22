import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { z } from "zod";

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
      })
    )
    .output(z.array(TaskSchema))
    .query(({ input }) =>
      getTasks(input.tags ?? [], input.assigneeIds ?? [], input.listIds ?? [])
    ),
});

export type AppRouter = typeof appRouter;
