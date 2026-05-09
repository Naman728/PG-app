import { loadEnv } from "../../config/env.js";
export const REFRESH_COOKIE = "pm_refresh";
export function setRefreshCookie(res, token) {
    const env = loadEnv();
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
        path: "/",
    });
}
export function clearRefreshCookie(res) {
    const env = loadEnv();
    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
}
//# sourceMappingURL=auth.cookies.js.map