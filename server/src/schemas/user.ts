import { z } from "zod";
import { ColorSchema } from "./color";

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  initials: z.string(),
  color: ColorSchema,
});

export type User = z.infer<typeof UserSchema>;
