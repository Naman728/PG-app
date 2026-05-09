import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Propagates `X-Request-Id` for tracing across logs, errors, and downstream proxies.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get("x-request-id");
  const id = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
