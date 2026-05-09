import { sendSuccess } from "../../common/apiResponse.js";
import { prisma } from "../../prisma/client.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TenantInvitationService } from "./tenant-invitation.service.js";
const tenantInvites = new TenantInvitationService();
export const createTenantInvitation = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const body = req.body;
    const inviterId = req.auth.userId;
    const inviter = await prisma.user.findFirst({ where: { id: inviterId } });
    const inviterDisplayName = inviter?.name?.trim() || inviter?.phone || "PG Manager";
    const result = await tenantInvites.createInvite({
        organizationId: orgId,
        invitedByUserId: inviterId,
        input: body,
        inviterDisplayName,
    });
    sendSuccess(res, {
        id: result.id,
        expiresAt: result.expiresAt,
    });
});
export const listTenantInvitations = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const rows = await tenantInvites.listPending(orgId);
    sendSuccess(res, { invitations: rows });
});
//# sourceMappingURL=tenant-invitation-owner.controller.js.map