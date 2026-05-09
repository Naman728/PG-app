import type { OrgRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { forbidden } from "../common/httpErrors.js";
import { prisma } from "../prisma/client.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Requires membership in `:orgId` with one of the allowed org roles.
 * Must run after `requireAuth`.
 */
export function requireOrgRoles(...allowed: OrgRole[]) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const orgId = req.params.orgId;
    const userId = req.auth?.userId;
    if (!orgId || !userId) {
      next(forbidden("Missing organization context"));
      return;
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: orgId,
        userId,
        organization: { deletedAt: null },
      },
    });

    if (!member || !allowed.includes(member.orgRole)) {
      next(forbidden("No access to this organization"));
      return;
    }

    req.organizationMember = member;
    next();
  });
}
