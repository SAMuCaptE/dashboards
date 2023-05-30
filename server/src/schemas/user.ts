import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  initials: z.string(),
  color: z.string().regex(/#[0-9a-fA-F]{6}/),
});

export type User = z.infer<typeof UserSchema>;
