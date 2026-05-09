import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { forbidden } from "../common/httpErrors.js";

/**
 * Requires an authenticated user whose JWT role is one of `allowed`.
 * Must run after `requireAuth`.
 */
export function requireRoles(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role || !allowed.includes(role)) {
      next(forbidden("Insufficient permissions for this resource"));
      return;
    }
    next();
  };
}
