import { z } from "zod";
import { SpaceSchema } from "../schemas/space";
import { api } from "./api";

const ResponseSchema = z.object({
  spaces: z.array(SpaceSchema),
});

export async function getSpaces() {
  const teamId = "9003057443";
  const spaces = await api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/team/${teamId}/space`
  );

  return spaces?.spaces ?? null;
}
