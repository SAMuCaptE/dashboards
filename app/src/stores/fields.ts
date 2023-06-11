import { createResource } from "solid-js";
import { dueDate, isValidDate, session } from "./params";
import { mergeDeep } from "../utils";
import { z } from "zod";

const schema = z.object({
  objective: z.string(),
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
});

const [defaults] = createResource(async () => {
  const response = await fetch(`./fields/defaults.json`);
  return response.json();
});

const [fields, { refetch }] = createResource(async () => {
  if (!isValidDate()) {
    return { success: false, error: "Not a thursday" };
  }

  const date = dueDate().toLocaleDateString("fr-CA");
  try {
    const response = await fetch(`./fields/${session()}/${date}/data.json`);
    const data = await response.json();
    return schema.safeParse(mergeDeep(defaults(), data));
  } catch (err) {
    return {
      success: false,
      error: "Could not find " + session() + "/" + date,
    };
  }
});

export { fields, refetch };
