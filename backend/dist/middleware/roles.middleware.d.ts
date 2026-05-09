import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
/**
 * Requires an authenticated user whose JWT role is one of `allowed`.
 * Must run after `requireAuth`.
 */
export declare function requireRoles(...allowed: UserRole[]): (req: Request, _res: Response, next: NextFunction) => void;
