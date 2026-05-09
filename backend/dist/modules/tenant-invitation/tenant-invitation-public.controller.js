import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { setRefreshCookie } from "../auth/auth.cookies.js";
import { TenantInvitationService } from "./tenant-invitation.service.js";
const tenantInvites = new TenantInvitationService();
export const previewInvitation = asyncHandler(async (req, res) => {
    const data = await tenantInvites.previewInvite(req.params.token);
    sendSuccess(res, data);
});
export const requestInvitationOtp = asyncHandler(async (req, res) => {
    const data = await tenantInvites.requestInviteOtp(req.params.token);
    sendSuccess(res, data);
});
export const verifyInvitationOtp = asyncHandler(async (req, res) => {
    const body = req.body;
    const { user, accessToken, refreshToken } = await tenantInvites.verifyInviteOtp(req.params.token, body, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, {
        accessToken,
        user: {
            id: user.id,
            phone: user.phone,
            email: user.email,
            name: user.name,
            role: user.role,
            phoneVerified: user.phoneVerified,
        },
    });
});
//# sourceMappingURL=tenant-invitation-public.controller.js.map