import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual, } from "node:crypto";
import { loadEnv } from "../../config/env.js";
export function generateNumericOtp(length = 6) {
    const max = 10 ** length;
    const n = randomInt(0, max);
    return n.toString().padStart(length, "0");
}
export function hashOtp(code) {
    const secret = loadEnv().JWT_SECRET;
    return createHmac("sha256", secret).update(`otp:${code}`).digest("hex");
}
export function verifyOtp(code, storedHash) {
    const computed = Buffer.from(hashOtp(code), "hex");
    const expected = Buffer.from(storedHash, "hex");
    if (computed.length !== expected.length)
        return false;
    return timingSafeEqual(computed, expected);
}
export function hashRefreshToken(raw) {
    return createHash("sha256").update(raw).digest("hex");
}
export function createRefreshTokenValue() {
    return randomBytes(32).toString("hex");
}
/** Shorter opaque token for SMS links (still high entropy). */
export function createInviteTokenValue() {
    return randomBytes(24).toString("hex");
}
//# sourceMappingURL=cryptoTokens.js.map