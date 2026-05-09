import { Router } from "express";
import { sendSuccess } from "../common/apiResponse.js";
import { prisma } from "../prisma/client.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRouter = Router();

/** Fast liveness for orchestrators (no DB). */
healthRouter.get(
  "/live",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { status: "live", service: "pg-manager-api" });
  }),
);

/** Full process health (legacy path). */
healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    sendSuccess(res, { status: "ok", service: "pg-manager-api" });
  }),
);

/** Readiness — verifies database connectivity. */
healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: "ready",
      service: "pg-manager-api",
      checks: { database: { ok: true, latencyMs: Date.now() - start } },
    });
  }),
);
