import type { Prisma } from "@prisma/client";
export declare class AuthRepository {
    countRecentOtpChallenges(phone: string, since: Date): Promise<number>;
    expireOpenChallenges(phone: string): Promise<void>;
    createOtpChallenge(data: {
        phone: string;
        codeHash: string;
        channel: string;
        expiresAt: Date;
        userId?: string | null;
    }): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        userId: string | null;
        expiresAt: Date;
        codeHash: string;
        channel: string;
        consumedAt: Date | null;
        attemptCount: number;
    }>;
    findLatestOpenChallenge(phone: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        userId: string | null;
        expiresAt: Date;
        codeHash: string;
        channel: string;
        consumedAt: Date | null;
        attemptCount: number;
    } | null>;
    incrementChallengeAttempts(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        userId: string | null;
        expiresAt: Date;
        codeHash: string;
        channel: string;
        consumedAt: Date | null;
        attemptCount: number;
    }>;
    consumeChallenge(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        userId: string | null;
        expiresAt: Date;
        codeHash: string;
        channel: string;
        consumedAt: Date | null;
        attemptCount: number;
    }>;
    findUserByPhone(phone: string): Promise<{
        name: string | null;
        id: string;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    findUserByEmail(email: string): Promise<{
        name: string | null;
        id: string;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    findUserById(id: string): Promise<{
        name: string | null;
        id: string;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    } | null>;
    createUser(data: Prisma.UserCreateInput): Promise<{
        name: string | null;
        id: string;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    updateUser(id: string, data: Prisma.UserUpdateInput): Promise<{
        name: string | null;
        id: string;
        phone: string | null;
        email: string | null;
        passwordHash: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        phoneVerified: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    countMemberships(userId: string): Promise<number>;
    createOrganizationWithOwnerMembership(params: {
        userId: string;
        orgName: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        city: string;
        addressLine1: string | null;
        addressLine2: string | null;
        locality: string | null;
        pincode: string | null;
        onboardingCompletedAt: Date | null;
    }>;
    createRefreshToken(data: {
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
        userAgent: string | null;
        ip: string | null;
    }>;
    findRefreshTokenByHash(tokenHash: string): Promise<({
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
            passwordHash: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            phoneVerified: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
        userAgent: string | null;
        ip: string | null;
    }) | null>;
    revokeRefreshToken(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
        userAgent: string | null;
        ip: string | null;
    }>;
    revokeAllUserRefreshTokens(userId: string): Promise<Prisma.BatchPayload>;
}
