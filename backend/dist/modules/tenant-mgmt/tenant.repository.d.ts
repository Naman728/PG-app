import type { Prisma, TenantDocumentCategory, TenantLifecycleStatus } from "@prisma/client";
export type TenantListQuery = {
    page: number;
    pageSize: number;
    status?: TenantLifecycleStatus;
    q?: string;
};
export declare class TenantRepository {
    findMembershipTenantOrg(userId: string): Prisma.Prisma__OrganizationMemberClient<({
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
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        userId: string;
        orgRole: import("@prisma/client").$Enums.OrgRole;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findTenantByOrgUser(organizationId: string, userId: string): Prisma.Prisma__TenantClient<({
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            organizationId: string;
            tenantId: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            cloudinaryPublicId: string;
            resourceType: string;
            reviewNote: string | null;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
        }[];
        emergencyContacts: {
            name: string;
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            relation: string;
            isPrimary: boolean;
        }[];
    } & {
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        userId: string;
        moveInAt: Date | null;
        moveOutAt: Date | null;
        aadhaarLast4: string | null;
        dateOfBirth: Date | null;
        occupation: string | null;
        permanentAddress: string | null;
        kycSubmittedAt: Date | null;
        onboardedAt: Date | null;
        statusNote: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findTenantByIdForOrg(tenantId: string, organizationId: string): Prisma.Prisma__TenantClient<({
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            organizationId: string;
            tenantId: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            cloudinaryPublicId: string;
            resourceType: string;
            reviewNote: string | null;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
        }[];
        emergencyContacts: {
            name: string;
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            relation: string;
            isPrimary: boolean;
        }[];
    } & {
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        userId: string;
        moveInAt: Date | null;
        moveOutAt: Date | null;
        aadhaarLast4: string | null;
        dateOfBirth: Date | null;
        occupation: string | null;
        permanentAddress: string | null;
        kycSubmittedAt: Date | null;
        onboardedAt: Date | null;
        statusNote: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    listTenantsForOrg(organizationId: string, query: TenantListQuery): Promise<{
        items: ({
            user: {
                name: string | null;
                id: string;
                phone: string | null;
                email: string | null;
            };
        } & {
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            organizationId: string;
            userId: string;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            aadhaarLast4: string | null;
            dateOfBirth: Date | null;
            occupation: string | null;
            permanentAddress: string | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            statusNote: string | null;
        })[];
        total: number;
    }>;
    createTenant(data: Prisma.TenantCreateInput): Prisma.Prisma__TenantClient<{
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        userId: string;
        moveInAt: Date | null;
        moveOutAt: Date | null;
        aadhaarLast4: string | null;
        dateOfBirth: Date | null;
        occupation: string | null;
        permanentAddress: string | null;
        kycSubmittedAt: Date | null;
        onboardedAt: Date | null;
        statusNote: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    upsertTenantOnboarding(organizationId: string, userId: string): Prisma.Prisma__TenantClient<{
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            organizationId: string;
            tenantId: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            cloudinaryPublicId: string;
            resourceType: string;
            reviewNote: string | null;
            reviewedByUserId: string | null;
            reviewedAt: Date | null;
        }[];
        emergencyContacts: {
            name: string;
            id: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            tenantId: string;
            relation: string;
            isPrimary: boolean;
        }[];
    } & {
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        userId: string;
        moveInAt: Date | null;
        moveOutAt: Date | null;
        aadhaarLast4: string | null;
        dateOfBirth: Date | null;
        occupation: string | null;
        permanentAddress: string | null;
        kycSubmittedAt: Date | null;
        onboardedAt: Date | null;
        statusNote: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateTenant(id: string, data: Prisma.TenantUpdateInput): Prisma.Prisma__TenantClient<{
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        userId: string;
        moveInAt: Date | null;
        moveOutAt: Date | null;
        aadhaarLast4: string | null;
        dateOfBirth: Date | null;
        occupation: string | null;
        permanentAddress: string | null;
        kycSubmittedAt: Date | null;
        onboardedAt: Date | null;
        statusNote: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findDocumentForTenant(docId: string, tenantId: string): Prisma.Prisma__TenantDocumentClient<({
        tenant: {
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantId: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        resourceType: string;
        reviewNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findDocumentForOrg(docId: string, organizationId: string): Prisma.Prisma__TenantDocumentClient<({
        tenant: {
            userId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantId: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        resourceType: string;
        reviewNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    createDocument(data: Prisma.TenantDocumentCreateInput): Prisma.Prisma__TenantDocumentClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantId: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        resourceType: string;
        reviewNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    softDeleteDocument(id: string): Prisma.Prisma__TenantDocumentClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantId: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        resourceType: string;
        reviewNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateDocument(id: string, data: Prisma.TenantDocumentUpdateInput): Prisma.Prisma__TenantDocumentClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantId: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        resourceType: string;
        reviewNote: string | null;
        reviewedByUserId: string | null;
        reviewedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    countDocumentsByTenant(tenantId: string): Prisma.PrismaPromise<number>;
    hasCategory(tenantId: string, category: TenantDocumentCategory): Prisma.Prisma__TenantDocumentClient<{
        id: string;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    createEmergencyContact(data: Prisma.TenantEmergencyContactCreateInput): Prisma.Prisma__TenantEmergencyContactClient<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    findEmergencyContact(id: string, tenantId: string): Prisma.Prisma__TenantEmergencyContactClient<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    updateEmergencyContact(id: string, data: Prisma.TenantEmergencyContactUpdateInput): Prisma.Prisma__TenantEmergencyContactClient<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    softDeleteEmergencyContact(id: string): Prisma.Prisma__TenantEmergencyContactClient<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    countEmergencyContacts(tenantId: string): Prisma.PrismaPromise<number>;
    findBedAssignment(organizationId: string, tenantUserId: string): Prisma.Prisma__BedClient<({
        room: {
            floor: {
                name: string;
                id: string;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            sortOrder: number;
            floorId: string;
            sharingLabel: string | null;
            colStart: number;
            colSpan: number;
            rowStart: number;
            rowSpan: number;
        };
    } & {
        status: import("@prisma/client").$Enums.BedStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantUserId: string | null;
        roomId: string;
        label: string;
        monthlyRentMinor: number;
        paidThrough: Date | null;
        maintenanceNote: string | null;
        assignedAt: Date | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    listHistory(organizationId: string, tenantUserId: string, take: number, skip: number): Prisma.PrismaPromise<({
        createdBy: {
            name: string | null;
            id: string;
            phone: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        organizationId: string;
        tenantUserId: string;
        eventType: string;
        payload: Prisma.JsonValue | null;
        createdByUserId: string | null;
    })[]>;
    countHistory(organizationId: string, tenantUserId: string): Prisma.PrismaPromise<number>;
    appendHistory(data: Prisma.TenantHistoryCreateInput): Prisma.Prisma__TenantHistoryClient<{
        id: string;
        createdAt: Date;
        organizationId: string;
        tenantUserId: string;
        eventType: string;
        payload: Prisma.JsonValue | null;
        createdByUserId: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
