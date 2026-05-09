import type { TenantDocumentCategory } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { type CreateEmergencyContactInput, type OwnerReviewDocumentInput, type OwnerTenantListQuery, type OwnerUpdateTenantInput, type UpdateEmergencyContactInput, type UpdateTenantProfileInput } from "@pg-manager/shared";
import { TenantRepository } from "./tenant.repository.js";
export declare class TenantService {
    private readonly repo;
    constructor(repo?: TenantRepository);
    private resolveTenantContext;
    getMyProfile(userId: string): Promise<{
        tenant: {
            id: string;
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            aadhaarMasked: string | null;
            dateOfBirth: Date | null;
            occupation: string | null;
            permanentAddress: string | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            statusNote: string | null;
        };
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            reviewNote: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
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
        bedAssignment: {
            bedId: string;
            label: string;
            monthlyRentMinor: number;
            room: {
                id: string;
                name: string;
            };
            floor: {
                name: string;
                id: string;
            };
        } | null;
    }>;
    updateMyProfile(userId: string, input: UpdateTenantProfileInput): Promise<{
        tenant: {
            id: string;
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            aadhaarMasked: string | null;
            dateOfBirth: Date | null;
            occupation: string | null;
            permanentAddress: string | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            statusNote: string | null;
        };
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            reviewNote: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
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
        bedAssignment: {
            bedId: string;
            label: string;
            monthlyRentMinor: number;
            room: {
                id: string;
                name: string;
            };
            floor: {
                name: string;
                id: string;
            };
        } | null;
    }>;
    submitMyKyc(userId: string): Promise<{
        ok: boolean;
        status: import("@prisma/client").$Enums.TenantLifecycleStatus;
        kycSubmittedAt: Date | null;
    }>;
    uploadMyDocument(userId: string, category: TenantDocumentCategory, file: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
        size: number;
    }): Promise<{
        id: string;
        category: import("@prisma/client").$Enums.TenantDocumentCategory;
        reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
        originalFilename: string;
        createdAt: Date;
    }>;
    deleteMyDocument(userId: string, documentId: string): Promise<{
        ok: boolean;
    }>;
    getMyDocumentSignedUrl(userId: string, documentId: string): Promise<{
        url: string;
        expiresInSec: number;
    }>;
    listMyEmergencyContacts(userId: string): Promise<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }[]>;
    createMyEmergencyContact(userId: string, input: CreateEmergencyContactInput): Promise<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }>;
    updateMyEmergencyContact(userId: string, contactId: string, input: UpdateEmergencyContactInput): Promise<{
        name: string;
        id: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        tenantId: string;
        relation: string;
        isPrimary: boolean;
    }>;
    deleteMyEmergencyContact(userId: string, contactId: string): Promise<{
        ok: boolean;
    }>;
    listMyHistory(userId: string, page: number, pageSize: number): Promise<{
        items: {
            id: string;
            eventType: string;
            payload: Prisma.JsonValue;
            createdAt: Date;
            createdBy: {
                name: string | null;
                id: string;
                phone: string | null;
            } | null;
        }[];
        page: number;
        pageSize: number;
        total: number;
    }>;
    listTenantsForOwner(organizationId: string, query: OwnerTenantListQuery): Promise<{
        items: {
            id: string;
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            user: {
                name: string | null;
                id: string;
                phone: string | null;
                email: string | null;
            };
            aadhaarMasked: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getTenantForOwner(organizationId: string, tenantId: string): Promise<{
        tenant: {
            id: string;
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            aadhaarMasked: string | null;
            dateOfBirth: Date | null;
            occupation: string | null;
            permanentAddress: string | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            statusNote: string | null;
        };
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            reviewNote: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
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
        bedAssignment: {
            bedId: string;
            label: string;
            monthlyRentMinor: number;
            room: {
                id: string;
                name: string;
            };
            floor: {
                name: string;
                id: string;
            };
        } | null;
    }>;
    updateTenantByOwner(organizationId: string, tenantId: string, actorUserId: string, input: OwnerUpdateTenantInput): Promise<{
        tenant: {
            id: string;
            status: import("@prisma/client").$Enums.TenantLifecycleStatus;
            moveInAt: Date | null;
            moveOutAt: Date | null;
            aadhaarMasked: string | null;
            dateOfBirth: Date | null;
            occupation: string | null;
            permanentAddress: string | null;
            kycSubmittedAt: Date | null;
            onboardedAt: Date | null;
            statusNote: string | null;
        };
        user: {
            name: string | null;
            id: string;
            phone: string | null;
            email: string | null;
        };
        documents: {
            id: string;
            category: import("@prisma/client").$Enums.TenantDocumentCategory;
            reviewStatus: import("@prisma/client").$Enums.TenantDocumentReviewStatus;
            originalFilename: string;
            mimeType: string;
            byteSize: number;
            reviewNote: string | null;
            reviewedAt: Date | null;
            createdAt: Date;
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
        bedAssignment: {
            bedId: string;
            label: string;
            monthlyRentMinor: number;
            room: {
                id: string;
                name: string;
            };
            floor: {
                name: string;
                id: string;
            };
        } | null;
    }>;
    ownerDocumentSignedUrl(organizationId: string, documentId: string): Promise<{
        url: string;
        expiresInSec: number;
    }>;
    ownerReviewDocument(organizationId: string, documentId: string, actorUserId: string, input: OwnerReviewDocumentInput): Promise<{
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
    }>;
    listTenantHistoryForOwner(organizationId: string, tenantRecordId: string, page: number, pageSize: number): Promise<{
        items: {
            id: string;
            eventType: string;
            payload: Prisma.JsonValue;
            createdAt: Date;
            createdBy: {
                name: string | null;
                id: string;
                phone: string | null;
            } | null;
        }[];
        page: number;
        pageSize: number;
        total: number;
    }>;
}
