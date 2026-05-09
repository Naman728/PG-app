import winston from "winston";
import { loadEnv } from "../config/env.js";

function resolveLogLevel(): string {
  try {
    return loadEnv().logLevel;
  } catch {
    return "info";
  }
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${String(timestamp)} [${level}]: ${String(message)}${rest}`;
  }),
);

export const logger = winston.createLogger({
  level: resolveLogLevel(),
  defaultMeta: { service: "pg-manager-api" },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === "production" ? jsonFormat : consoleFormat,
    }),
  ],
});

/** Stream for Morgan HTTP access logs (Winston). */
export const httpAccessLogStream = {
  write(message: string) {
    logger.info(message.trim());
  },
};
