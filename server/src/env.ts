import { config } from "dotenv";
import { z } from "zod";

const EnvSchema = z.object({
  API_KEY: z.string(),
  HOURS_START_DATE: z.string(),
  HOURS_WEEKLY_OFFSET: z.string(),

  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_HOSTNAME: z.string(),
  DB_PORT: z
    .string()
    .transform((str) => parseInt(str))
    .optional(),
});

config();
EnvSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof EnvSchema> {}
  }
}
