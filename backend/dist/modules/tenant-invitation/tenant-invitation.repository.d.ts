export declare class TenantInvitationRepository {
    expirePendingForPhoneOrg(organizationId: string, phone: string): Promise<void>;
    create(data: {
        organizationId: string;
        phone: string;
        invitedByUserId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        organizationId: string;
        tokenHash: string;
        expiresAt: Date;
        consumedAt: Date | null;
        invitedByUserId: string;
    }>;
    findActiveByTokenHash(tokenHash: string): Promise<({
        organization: {
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
        };
        invitedBy: {
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
        phone: string;
        createdAt: Date;
        organizationId: string;
        tokenHash: string;
        expiresAt: Date;
        consumedAt: Date | null;
        invitedByUserId: string;
    }) | null>;
    consume(id: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        organizationId: string;
        tokenHash: string;
        expiresAt: Date;
        consumedAt: Date | null;
        invitedByUserId: string;
    }>;
    listPendingForOrg(organizationId: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        expiresAt: Date;
        invitedBy: {
            name: string | null;
            id: string;
            phone: string | null;
        };
    }[]>;
}
