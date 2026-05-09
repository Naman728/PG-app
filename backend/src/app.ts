import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import { loadEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { healthRouter } from "./routes/health.routes.js";
import { httpAccessLogStream } from "./services/logger.service.js";
import { v1Router } from "./routes/v1/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadOpenApiSpec(): Record<string, unknown> | null {
  try {
    const path = join(__dirname, "openapi.json");
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function createApp() {
  const env = loadEnv();
  const app = express();

  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
      hsts:
        env.NODE_ENV === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("combined", { stream: httpAccessLogStream }));

  app.use("/health", healthRouter);

  if (env.NODE_ENV !== "test") {
    const spec = loadOpenApiSpec();
    if (spec) {
      app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec, { customSiteTitle: "PG Manager API" }));
    }
  }

  app.use("/api/v1", v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
