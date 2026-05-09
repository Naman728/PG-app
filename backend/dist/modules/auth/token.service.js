import jwt from "jsonwebtoken";
import { loadEnv } from "../../config/env.js";
export function signAccessToken(payload) {
    const env = loadEnv();
    return jwt.sign({ role: payload.role }, env.JWT_SECRET, {
        subject: payload.sub,
        expiresIn: `${env.JWT_ACCESS_TTL_MIN}m`,
        issuer: "pg-manager",
        audience: "pg-manager-api",
    });
}
export function verifyAccessToken(token) {
    const env = loadEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: "pg-manager",
        audience: "pg-manager-api",
        complete: false,
    });
    if (!decoded.sub) {
        throw new Error("Invalid token subject");
    }
    return { sub: decoded.sub, role: decoded.role };
}
//# sourceMappingURL=token.service.js.map