import { Member, Problem, Risk, Session } from "common";
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
      port: process.env.DB_PORT,
    });
    result = await callback(connection);
  } finally {
    await connection?.end();
  }

  return result;
}

const schema = z.object({
  sessions: z.record(
    Session,
    z.object({
      objective: z
        .string()
        .or(z.array(z.string()).transform((arr) => arr.join(" | "))),
    }),
  ),
  members: z.array(Member),
  meeting: z.object({
    date: z.string(),
    agenda: z.object({
      items: z.array(z.string()),
    }),
    technical: z.object({
      items: z.array(z.string()),
    }),
  }),
  risks: z.array(Risk),
  sprint: z.object({
    id: z.string(),
    objective: z.string(),
    problems: z.array(Problem),
  }),
});

export type Fields = z.infer<typeof schema>;

let cachedQuery: string = "";
let cachedDefaults: Record<string, unknown> | null = null;
let cachedFields: Fields | null = null;

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
  session: Session,
  date: string,
): Promise<Fields> {
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
  for (const member of fields.members) {
    member.disponibility.lastWeek = member.disponibility.nextWeek;
    member.disponibility.nextWeek = 6;
  }

  await database(async (db) => {
    const stmt = await db.prepare(
      "replace into fields (data, due_date, session) values (?, ?, ?)",
    );
    await stmt.execute([JSON.stringify(fields), dueDate, session]);
    await stmt.close();
  });
}

export async function editFields(
  { dueDate, session }: { dueDate: string; session: Session },
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
  input: { dueDate: string; session: Session },
  selector: (fields: Fields) => T,
): Promise<T> {
  const fields = await getMergedFields(input.dueDate, input.session);
  if (!fields.success) {
    throw new Error(fields.error);
  }
  return selector(fields.data!);
}
