import { initTRPC } from "@trpc/server";
import SuperJSON from "superjson";
import { z } from "zod";

import { getUsers } from "./api/get-users";
import { getBudget } from "./api/money";
import { getWorkedHours } from "./api/worked-hours";
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
    .query(async ({ input }) => getWorkedHours(input.start, input.end)),

  budget: t.procedure
    .input(z.object({ date: z.number().transform((num) => new Date(num)) }))
    .query(async ({ input }) => getBudget(input.date)),
});

export type AppRouter = typeof appRouter;
