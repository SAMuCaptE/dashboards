import { z } from "zod";

export const Color = z.string().regex(/#[0-9a-fA-F]{6}/);