import { TRPCError, initTRPC } from "@trpc/server";
import { Connection, createConnection } from "mysql2/promise";
import { z } from "zod";
import { mergeDeep } from "../utils";

async function database<T>(
  callback: (db: Connection) => Promise<T>,
): Promise<T | null> {
  let connection: Connection | null = null;
  let result: T | null = null;

  try {
    connection = await createConnection({
      host: process.env.DB_HOSTNAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    result = await callback(connection);
  } finally {
    await connection?.end();
  }

  return result;
}

const RiskSchema = z.object({
  description: z.string(),
  mitigation: z.string(),
  gravity: z.number().min(1),
  ticketUrl: z.string().url().optional().nullable(),
});

export const ProblemSchema = z.object({
  description: z.string(),
  taskId: z.string(),
});

export const Session = z.enum(["s6", "s7", "t5", "s8"]);
export type Session = z.infer<typeof Session>;

const schema = z.object({
  sessions: z.record(
    Session,
    z.object({
      objective: z
        .string()
        .or(z.array(z.string()).transform((arr) => arr.join(" | "))),
    }),
  ),
  members: z.array(
    z.object({
      img: z.string(),
      firstname: z.string(),
      lastname: z.string(),
      role: z.string(),
      disponibility: z.object({
        lastWeek: z.number().min(1).max(6),
        nextWeek: z.number().min(1).max(6),
      }),
    }),
  ),
  meeting: z.object({
    date: z.string(),
    agenda: z.object({
      items: z.array(z.string()),
    }),
    technical: z.object({
      items: z.array(z.string()),
    }),
  }),
  risks: z.array(RiskSchema),
  sprint: z.object({
    id: z.string(),
    objective: z.string(),
    problems: z.array(ProblemSchema),
  }),
});

export type Fields = z.infer<typeof schema>;

let cachedQuery: string = "";
let cachedDefaults: Record<string, unknown> | null = null;
let cachedFields: Fields | null = null;

export const SelectedDashboard = z.object({
  dueDate: z.string(),
  session: Session,
});

export type SelectedDashboard = z.infer<typeof SelectedDashboard>;

export async function existsFields(session: string, dueDate: string) {
  return !!(await database(async (db) => {
    const stmt = await db.prepare(
      "select 1 from fields where session = ? and due_date = ? limit 1",
    );
    const [result] = await stmt.execute([session, dueDate]);
    return (result as any).length === 1;
  }));
}

async function getDefaults() {
  if (cachedDefaults !== null) {
    return cachedDefaults;
  }

  cachedDefaults = await database(async (db) => {
    const [result] = await db.query("select data from defaults limit 1;");
    return JSON.parse((result as any)[0].data);
  });
  return cachedDefaults || {};
}

async function getFields(session: string, dueDate: string): Promise<Fields> {
  console.log("getting fields for ", session, dueDate, cachedFields);
  if (cachedFields) {
    return cachedFields;
  }

  const fields = await database(async (db) => {
    const stmt = await db.prepare(
      "select * from fields where due_date = ? and session = ? limit 1",
    );
    const [result] = await stmt.execute([dueDate, session]);
    return (result as any).length > 0
      ? JSON.parse((result as any)[0].data)
      : undefined;
  });

  if (!fields) {
    throw new Error("could not find fields");
  }

  cachedFields = fields;
  return fields as Fields;
}

async function getFieldsTemplate(
  session: z.infer<typeof SelectedDashboard>["session"],
  date: string,
) {
  try {
    return await getFields(session, date);
  } catch {
    const emptyFields = await database(async (db) => {
      const [result] = await db.query("select data from empty_data limit 1;");
      return JSON.parse((result as any)[0].data);
    });

    if (!emptyFields) {
      throw new Error("could not find defaults");
    }

    return emptyFields;
  }
}

export async function copyPreviousFields(session: Session, dueDate: string) {
  const oneWeekBefore = new Date(
    new Date(dueDate).getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString("fr-CA");

  const fields = await getFieldsTemplate(session, oneWeekBefore);
  await database(async (db) => {
    const stmt = await db.prepare(
      "replace into fields (data, due_date, session) values (?, ?, ?)",
    );
    await stmt.execute([JSON.stringify(fields), dueDate, session]);
    await stmt.close();
  });
}

export async function editFields(
  { dueDate, session }: z.infer<typeof SelectedDashboard>,
  modify: (original: Fields) => Fields,
) {
  const fields = await getFields(session, dueDate);
  const modifiedFields = modify(fields);
  cachedFields = null;

  await database(async (db) => {
    const stmt = await db.prepare(
      "replace into fields (data, due_date, session) values (?, ?, ?)",
    );
    await stmt.execute([JSON.stringify(modifiedFields), dueDate, session]);
    await stmt.close();
  });
}

async function getMergedFields(
  dueDate: string,
  session: z.infer<typeof Session>,
) {
  try {
    const query = `${session}-${dueDate}`;
    if (query !== cachedQuery) {
      cachedDefaults = null;
      cachedFields = null;
    }
    cachedQuery = query;

    const defaults = await getDefaults();
    const data = await getFields(session, dueDate);
    const payload = mergeDeep(defaults, data);
    const result = schema.safeParse(payload);

    return result.success
      ? { success: true, data: result.data }
      : { success: false, error: JSON.parse(result.error.message) };
  } catch (err) {
    console.log(err);
    return {
      success: false,
      error: "Could not find " + session + "/" + dueDate,
    };
  }
}

export async function findField<T>(
  input: { dueDate: string; session: z.infer<typeof Session> },
  selector: (fields: Fields) => T,
): Promise<T> {
  const fields = await getMergedFields(input.dueDate, input.session);
  if (!fields.success) {
    throw new TRPCError({
      message: fields.error,
      code: "INTERNAL_SERVER_ERROR",
    });
  }
  return selector(fields.data!);
}

export function makeFieldsRouter(t: ReturnType<(typeof initTRPC)["create"]>) {
  return t.router({
    valid: t.procedure
      .input(SelectedDashboard)
      .output(z.object({ valid: z.boolean(), error: z.unknown() }))
      .query(async ({ input }) => {
        const fields = await getMergedFields(input.dueDate, input.session);
        return { valid: fields.success, error: fields.error ?? null };
      }),

    init: t.procedure.input(SelectedDashboard).mutation(async ({ input }) => {
      copyPreviousFields(input.session, input.dueDate);
    }),

    clearCache: t.procedure.mutation(() => {
      cachedFields = null;
      cachedDefaults = null;
    }),

    date: t.router({
      get: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) =>
          findField(input, (fields) => fields.meeting.date),
        ),

      edit: t.procedure
        .input(SelectedDashboard.and(z.object({ date: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.date = input.date;
            return original;
          }),
        ),
    }),

    daily: t.router({
      get: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) =>
          findField(input, (fields) => fields.meeting.agenda),
        ),

      add: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.agenda.items.push(input.objective);
            return original;
          }),
        ),
      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ target: z.string(), updated: z.string() }),
          ),
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            const targetIndex = original.meeting.agenda.items.findIndex(
              (item) => item === input.target,
            );
            original.meeting.agenda.items[targetIndex] = input.updated;
            return original;
          }),
        ),
      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.agenda.items =
              original.meeting.agenda.items.filter(
                (item) => item !== input.objective,
              );
            return original;
          }),
        ),
    }),

    technical: t.router({
      get: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) =>
          findField(input, (fields) => fields.meeting.technical),
        ),

      add: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.technical.items.push(input.objective);
            return original;
          }),
        ),
      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ target: z.string(), updated: z.string() }),
          ),
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            const targetIndex = original.meeting.technical.items.findIndex(
              (item) => item === input.target,
            );
            original.meeting.technical.items[targetIndex] = input.updated;
            return original;
          }),
        ),
      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ objective: z.string() })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.meeting.technical.items =
              original.meeting.technical.items.filter(
                (item) => item !== input.objective,
              );
            return original;
          }),
        ),
    }),

    objectives: t.router({
      get: t.procedure.input(SelectedDashboard).query(({ input }) =>
        findField(input, (fields) => ({
          sprint: fields.sprint.objective,
          session: fields.sessions[input.session]?.objective,
        })),
      ),

      sprint: t.router({
        update: t.procedure
          .input(SelectedDashboard.and(z.object({ objective: z.string() })))
          .mutation(({ input }) =>
            editFields(input, (original) => {
              original.sprint.objective = input.objective;
              return original;
            }),
          ),
      }),
    }),

    members: t.router({
      get: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) => findField(input, (fields) => fields.members)),

      disponibilities: t.router({
        edit: t.procedure
          .input(
            SelectedDashboard.and(
              z.object({
                selected: z.enum(["lastWeek", "nextWeek"]),
                memberIndex: z.number().int(),
                disponibility: z.number().int().min(1).max(6),
              }),
            ),
          )
          .mutation(({ input }) =>
            editFields(input, (original) => {
              original.members[input.memberIndex].disponibility[
                input.selected
              ] = input.disponibility;
              return original;
            }),
          ),
      }),
    }),

    risks: t.router({
      get: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) => findField(input, (fields) => fields.risks)),

      add: t.procedure
        .input(SelectedDashboard.and(z.object({ risk: RiskSchema })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.risks.push(input.risk);
            return original;
          }),
        ),

      update: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({ originalRisk: RiskSchema, updatedRisk: RiskSchema }),
          ),
        )
        .mutation(async ({ input }) =>
          editFields(input, (original) => {
            const riskIndex = original.risks.findIndex(
              (risk) => risk.description === input.originalRisk.description,
            );
            original.risks[riskIndex] = input.updatedRisk;
            return original;
          }),
        ),

      delete: t.procedure
        .input(SelectedDashboard.and(z.object({ risk: RiskSchema })))
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.risks = original.risks.filter(
              (risk) => risk.description !== input.risk.description,
            );
            return original;
          }),
        ),
    }),

    sprint: t.router({
      id: t.procedure
        .input(SelectedDashboard)
        .query(({ input }) => findField(input, (fields) => fields.sprint.id)),

      select: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({
              sprintId: z.string(),
            }),
          ),
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.sprint.id = input.sprintId;
            return original;
          }),
        ),

      problems: t.router({
        get: t.procedure
          .input(SelectedDashboard)
          .query(({ input }) =>
            findField(input, (fields) => fields.sprint.problems),
          ),

        add: t.procedure
          .input(SelectedDashboard.and(ProblemSchema))
          .mutation(async ({ input }) =>
            editFields(input, (original) => {
              original.sprint.problems.push({
                description: input.description,
                taskId: input.taskId,
              });
              return original;
            }),
          ),
        edit: t.procedure
          .input(
            SelectedDashboard.and(ProblemSchema).and(
              z.object({ updatedDescription: z.string() }),
            ),
          )
          .mutation(async ({ input }) =>
            editFields(input, (original) => {
              const index = original.sprint.problems.findIndex(
                (p) =>
                  p.taskId === input.taskId &&
                  p.description === input.description,
              );

              if (index >= 0) {
                original.sprint.problems[index] = {
                  description: input.updatedDescription,
                  taskId: input.taskId,
                };
              }
              return original;
            }),
          ),
        remove: t.procedure
          .input(SelectedDashboard.and(ProblemSchema))
          .mutation(async ({ input }) =>
            editFields(input, (original) => {
              original.sprint.problems = original.sprint.problems.filter(
                (p) =>
                  p.taskId !== input.taskId ||
                  p.description !== input.description,
              );
              return original;
            }),
          ),
      }),
    }),
  });
}
