import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL_MIN: z.coerce.number().min(5).max(120).default(15),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().min(1).max(60).default(14),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  /** Comma-separated origins; when set, overrides single `FRONTEND_URL` for CORS. */
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema> & {
  /** Parsed CORS origins for `cors()` middleware. */
  corsOrigin: string | string[];
  /** Effective Winston log level. */
  logLevel: string;
};

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(message)}`);
  }
  const base = parsed.data;
  const corsOrigin =
    base.CORS_ORIGINS?.trim()
      ? base.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
      : base.FRONTEND_URL;
  const logLevel =
    base.LOG_LEVEL ??
    (base.NODE_ENV === "production" ? "info" : "debug");
  cached = { ...base, corsOrigin, logLevel };
  return cached;
}
