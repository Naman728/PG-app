import type { UpdateOrganizationProfileInput } from "@pg-manager/shared";
export declare class OrganizationService {
    updateProfile(organizationId: string, input: UpdateOrganizationProfileInput): Promise<{
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
}
