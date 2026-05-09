import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    JWT_ACCESS_TTL_MIN: z.ZodDefault<z.ZodNumber>;
    JWT_REFRESH_TTL_DAYS: z.ZodDefault<z.ZodNumber>;
    FRONTEND_URL: z.ZodDefault<z.ZodString>;
    /** Comma-separated origins; when set, overrides single `FRONTEND_URL` for CORS. */
    CORS_ORIGINS: z.ZodOptional<z.ZodString>;
    LOG_LEVEL: z.ZodOptional<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    TWILIO_ACCOUNT_SID: z.ZodString;
    TWILIO_AUTH_TOKEN: z.ZodString;
    TWILIO_PHONE_NUMBER: z.ZodString;
    TWILIO_WHATSAPP_NUMBER: z.ZodString;
    CLOUDINARY_CLOUD_NAME: z.ZodString;
    CLOUDINARY_API_KEY: z.ZodString;
    CLOUDINARY_API_SECRET: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_ACCESS_TTL_MIN: number;
    JWT_REFRESH_TTL_DAYS: number;
    FRONTEND_URL: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
    TWILIO_WHATSAPP_NUMBER: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CORS_ORIGINS?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
}, {
    DATABASE_URL: string;
    JWT_SECRET: string;
    TWILIO_ACCOUNT_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_PHONE_NUMBER: string;
    TWILIO_WHATSAPP_NUMBER: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    PORT?: number | undefined;
    JWT_ACCESS_TTL_MIN?: number | undefined;
    JWT_REFRESH_TTL_DAYS?: number | undefined;
    FRONTEND_URL?: string | undefined;
    CORS_ORIGINS?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
}>;
export type Env = z.infer<typeof envSchema> & {
    /** Parsed CORS origins for `cors()` middleware. */
    corsOrigin: string | string[];
    /** Effective Winston log level. */
    logLevel: string;
};
export declare function loadEnv(): Env;
export {};
