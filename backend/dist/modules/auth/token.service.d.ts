import type { UserRole } from "@prisma/client";
export type AccessTokenPayload = {
    sub: string;
    role: UserRole;
};
export declare function signAccessToken(payload: AccessTokenPayload): string;
export declare function verifyAccessToken(token: string): AccessTokenPayload;
