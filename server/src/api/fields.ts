import { initTRPC } from "@trpc/server";
import { Connection, createConnection, OkPacket } from "mysql2/promise";
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

const schema = z.object({
  sessions: z.record(
    z.enum(["s6", "s7", "s8"]),
    z.object({
      objective: z.array(z.string()),
    }),
  ),
  members: z.array(
    z.object({
      img: z.string(),
      firstname: z.string(),
      lastname: z.string(),
      role: z.string(),
      disponibility: z.object({
        lastWeek: z.number().min(1).max(5),
        nextWeek: z.number().min(1).max(5),
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
    problems: z.array(
      z.object({
        taskId: z.string(),
        description: z.string(),
      }),
    ),
  }),
});

export type Fields = z.infer<typeof schema>;

const SelectedDashboard = z.object({
  dueDate: z.date(),
  session: z.enum(["s6", "s7", "s8"]),
});

async function getDefaults() {
  const defaults = await database(async (db) => {
    const [result] = await db.query("select data from defaults limit 1;");
    return JSON.parse((result as any)[0].data);
  });

  return defaults || {};
}

async function getFields(session: string, dueDate: Date): Promise<Fields> {
  const date = dueDate.toLocaleDateString("fr-CA");

  const fields = await database(async (db) => {
    const stmt = await db.prepare(
      "select * from fields where due_date = ? and session = ? limit 1",
    );
    const [result] = await stmt.execute([date, session]);
    return JSON.parse((result as any)[0].data);
  });

  if (!fields) {
    throw new Error("could not find fields");
  }

  return fields as Fields;
}

async function getFieldsTemplate(
  session: z.infer<typeof SelectedDashboard>["session"],
  date: Date,
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

async function copyPreviousFields(
  session: z.infer<typeof SelectedDashboard>["session"],
  dueDate: Date,
) {
  const oneWeekBefore = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const targetDateStr = dueDate.toLocaleDateString("fr-CA");

  const fields = await getFieldsTemplate(session, oneWeekBefore);
  await database(async (db) => {
    const stmt = await db.prepare(
      "replace into fields (data, due_date, session) values (?, ?, ?)",
    );
    await stmt.execute([JSON.stringify(fields), targetDateStr, session]);
    await stmt.close();
  });
}

async function editFields(
  { dueDate, session }: z.infer<typeof SelectedDashboard>,
  modify: (original: Fields) => Fields,
) {
  const dateStr = dueDate.toLocaleDateString("fr-CA");
  const fields = await getFields(session, dueDate);
  const modifiedFields = modify(fields);
  await database(async (db) => {
    const stmt = await db.prepare(
      "replace into fields (data, due_date, session) values (?, ?, ?)",
    );
    await stmt.execute([JSON.stringify(modifiedFields), dateStr, session]);
    await stmt.close();
  });
}

export function makeFieldsRouter(t: ReturnType<(typeof initTRPC)["create"]>) {
  return t.router({
    get: t.procedure
      .input(
        z.object({ dueDate: z.date(), session: z.enum(["s6", "s7", "s8"]) }),
      )
      .output(
        z
          .object({
            success: z.literal(true),
            data: schema,
          })
          .or(
            z.object({
              success: z.literal(false),
              error: z.string().or(z.array(z.any())),
            }),
          ),
      )
      .query(async ({ input }) => {
        try {
          const defaults = await getDefaults();
          const data = await getFields(input.session, input.dueDate);
          const payload = mergeDeep(defaults, data);
          const result = schema.safeParse(payload);

          return result.success
            ? { success: true, data: result.data }
            : { success: false, error: JSON.parse(result.error.message) };
        } catch (err) {
          return {
            success: false,
            error:
              "Could not find " +
              input.session +
              "/" +
              input.dueDate.toLocaleDateString("fr-CA"),
          };
        }
      }),

    init: t.procedure
      .input(
        z.object({ dueDate: z.date(), session: z.enum(["s6", "s7", "s8"]) }),
      )
      .mutation(async ({ input }) => {
        copyPreviousFields(input.session, input.dueDate);
      }),

    date: t.router({
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

    disponibilities: t.router({
      edit: t.procedure
        .input(
          SelectedDashboard.and(
            z.object({
              selected: z.enum(["lastWeek", "nextWeek"]),
              memberIndex: z.number().int(),
              disponibility: z.number().int().min(1).max(5),
            }),
          ),
        )
        .mutation(({ input }) =>
          editFields(input, (original) => {
            original.members[input.memberIndex].disponibility[input.selected] =
              input.disponibility;
            return original;
          }),
        ),
    }),

    risks: t.router({
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
    }),
  });
}
