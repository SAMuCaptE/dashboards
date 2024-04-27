import { z } from "zod";
import { ColorSchema } from "./color";

export const User = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  initials: z.string(),
  color: ColorSchema,
  profilePicture: z.string().url().nullable(),
});

export type User = z.infer<typeof User>;
