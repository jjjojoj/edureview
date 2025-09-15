import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  JWT_SECRET: z.string(),
  OPENROUTER_API_KEY: z.string(),
  OSS_ACCESS_KEY_ID: z.string(),
  OSS_ACCESS_KEY_SECRET: z.string(),
  OSS_ENDPOINT: z.string(),
  OSS_BUCKET: z.string(),
  OSS_REGION: z.string(),
  SILICONCLOUD_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
