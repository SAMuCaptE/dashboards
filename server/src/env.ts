import { config } from "dotenv";
import { z } from "zod";

const EnvSchema = z.object({
  API_KEY: z.string(),
  HOURS_START_DATE: z.string(),
  HOURS_WEEKLY_OFFSET: z.string(),
});

config();
EnvSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof EnvSchema> {}
  }
}
