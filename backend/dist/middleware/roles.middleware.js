import { forbidden } from "../common/httpErrors.js";
/**
 * Requires an authenticated user whose JWT role is one of `allowed`.
 * Must run after `requireAuth`.
 */
export function requireRoles(...allowed) {
    return (req, _res, next) => {
        const role = req.auth?.role;
        if (!role || !allowed.includes(role)) {
            next(forbidden("Insufficient permissions for this resource"));
            return;
        }
        next();
    };
}
//# sourceMappingURL=roles.middleware.js.map