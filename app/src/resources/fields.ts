import { createResource } from "solid-js";
import { SafeParseError, ZodError, ZodIssueCode, z } from "zod";
import { dueDate, isValidDate, session } from "../stores/params";
import { mergeDeep } from "../utils";

const schema = z.object({
  sessions: z.record(
    z.enum(["s6", "s7", "s8"]),
    z.object({
      objective: z.array(z.string()),
    })
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
    })
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
  risks: z.array(
    z.object({
      description: z.string(),
      mitigation: z.string(),
      gravity: z.number().min(1),
      ticketUrl: z.string().url().optional(),
    })
  ),
  sprint: z.object({
    id: z.string(),
    objective: z.string(),
    problems: z.array(
      z.object({
        task: z.string(),
        description: z.string(),
      })
    ),
  }),
});

const [defaults] = createResource(async () => {
  const response = await fetch(`./fields/defaults.json`);
  return response.json();
});

const [fields, { refetch }] = createResource(async () => {
  if (!isValidDate()) {
    return {
      success: false,
      error: new ZodError([
        { code: ZodIssueCode.custom, message: "Not a thursday", path: [] },
      ]),
    } satisfies SafeParseError<z.infer<typeof schema>>;
  }

  const date = dueDate().toLocaleDateString("fr-CA");
  try {
    const response = await fetch(`./fields/${session()}/${date}/data.json`);
    const data = await response.json();

    return schema.safeParse(mergeDeep(defaults(), data));
  } catch (err) {
    return {
      success: false,
      error: new ZodError([
        {
          code: ZodIssueCode.custom,
          message: "Could not find " + session() + "/" + date,
          path: [],
        },
      ]),
    } satisfies SafeParseError<z.infer<typeof schema>>;
  }
});

export type Fields = z.infer<typeof schema>;
export { fields, refetch };
