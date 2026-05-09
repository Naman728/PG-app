import { OrgRole, UserRole } from "@prisma/client";
export type MeProfile = {
    id: string;
    phone: string | null;
    email: string | null;
    name: string | null;
    role: UserRole;
    phoneVerified: boolean;
    lastLoginAt: Date | null;
    needsOwnerOnboarding: boolean;
    primaryOrganization: null | {
        id: string;
        name: string;
        city: string;
        addressLine1: string | null;
        addressLine2: string | null;
        locality: string | null;
        pincode: string | null;
        onboardingCompletedAt: Date | null;
        orgRole: OrgRole;
    };
    tenantProfile: null | {
        id: string;
        status: string;
        kycSubmittedAt: Date | null;
        moveInAt: Date | null;
        moveOutAt: Date | null;
    };
};
export declare class SessionService {
    getMeProfile(userId: string): Promise<MeProfile>;
}
