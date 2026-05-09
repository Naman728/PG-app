import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { SessionService } from "../session/session.service.js";
import { clearRefreshCookie, REFRESH_COOKIE, setRefreshCookie, } from "./auth.cookies.js";
import { AuthService } from "./auth.service.js";
const authService = new AuthService();
const sessionService = new SessionService();
function mapUserToDto(user) {
    return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneVerified: user.phoneVerified,
    };
}
export const register = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, {
        accessToken,
        user: mapUserToDto(user),
    });
});
export const login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    setRefreshCookie(res, refreshToken);
    sendSuccess(res, {
        accessToken,
        user: mapUserToDto(user),
    });
});
export const refreshSession = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const { user, accessToken, refreshToken: nextRefresh, } = await authService.refreshSession(refreshToken, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
    });
    setRefreshCookie(res, nextRefresh);
    sendSuccess(res, {
        accessToken,
        user: mapUserToDto(user),
    });
});
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    sendSuccess(res, { ok: true });
});
export const me = asyncHandler(async (req, res) => {
    const userId = req.auth.userId;
    const profile = await sessionService.getMeProfile(userId);
    sendSuccess(res, {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        phoneVerified: profile.phoneVerified,
        lastLoginAt: profile.lastLoginAt,
        needsOwnerOnboarding: profile.needsOwnerOnboarding,
        primaryOrganization: profile.primaryOrganization,
        tenantProfile: profile.tenantProfile
            ? {
                id: profile.tenantProfile.id,
                status: profile.tenantProfile.status,
                kycSubmittedAt: profile.tenantProfile.kycSubmittedAt,
                moveInAt: profile.tenantProfile.moveInAt,
                moveOutAt: profile.tenantProfile.moveOutAt,
            }
            : null,
    });
});
//# sourceMappingURL=auth.controller.js.map