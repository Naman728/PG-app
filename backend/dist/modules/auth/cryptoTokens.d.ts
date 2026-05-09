export declare function generateNumericOtp(length?: number): string;
export declare function hashOtp(code: string): string;
export declare function verifyOtp(code: string, storedHash: string): boolean;
export declare function hashRefreshToken(raw: string): string;
export declare function createRefreshTokenValue(): string;
/** Shorter opaque token for SMS links (still high entropy). */
export declare function createInviteTokenValue(): string;
