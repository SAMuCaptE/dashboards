import { z } from "zod";

export const Session = z.enum(["s6", "s7", "t5", "s8"]);
export type Session = z.infer<typeof Session>;
