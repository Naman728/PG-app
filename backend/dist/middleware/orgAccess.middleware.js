import { forbidden } from "../common/httpErrors.js";
import { prisma } from "../prisma/client.js";
import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * Requires membership in `:orgId` with one of the allowed org roles.
 * Must run after `requireAuth`.
 */
export function requireOrgRoles(...allowed) {
    return asyncHandler(async (req, _res, next) => {
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
//# sourceMappingURL=orgAccess.middleware.js.map