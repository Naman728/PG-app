import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../common/httpErrors.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    next(unauthorized("Missing access token"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized("Invalid or expired access token"));
  }
}
