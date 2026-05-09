import type { Prisma } from "@prisma/client";
import { MaintenanceMessageVisibility, MaintenanceTicketCategory, MaintenanceTicketPriority, MaintenanceTicketStatus } from "@prisma/client";
export declare function assertTenantInOrg(organizationId: string, userId: string): Promise<void>;
export declare function assertStaffInOrg(organizationId: string, userId: string): Promise<void>;
export declare function createMaintenanceTicket(params: {
    organizationId: string;
    tenantUserId: string;
    title: string;
    description: string;
    category: MaintenanceTicketCategory;
    priority: MaintenanceTicketPriority;
    bedId?: string | null;
}): Promise<{
    id: string;
}>;
export declare function listMaintenanceTicketsForOrg(params: {
    organizationId: string;
    query: {
        page: number;
        pageSize: number;
        status?: MaintenanceTicketStatus;
        category?: MaintenanceTicketCategory;
        priority?: MaintenanceTicketPriority;
        assignedToUserId?: string;
        q?: string;
    };
}): Promise<{
    items: ({
        bed: {
            id: string;
            label: string;
            room: {
                name: string;
                floor: {
                    name: string;
                };
            };
        } | null;
        tenant: {
            name: string | null;
            id: string;
            phone: string | null;
        };
        assignee: {
            name: string | null;
            id: string;
            phone: string | null;
        } | null;
    } & {
        status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantUserId: string;
        category: import("@prisma/client").$Enums.MaintenanceTicketCategory;
        bedId: string | null;
        title: string;
        description: string;
        priority: import("@prisma/client").$Enums.MaintenanceTicketPriority;
        assignedToUserId: string | null;
        resolutionSummary: string | null;
        resolutionCostMinor: number | null;
        resolvedAt: Date | null;
        resolutionRating: number | null;
        resolutionFeedback: string | null;
        ratedAt: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function listMyMaintenanceTickets(params: {
    organizationId: string;
    tenantUserId: string;
    page: number;
    pageSize: number;
}): Promise<{
    items: ({
        bed: {
            label: string;
            room: {
                name: string;
                floor: {
                    name: string;
                };
            };
        } | null;
        assignee: {
            name: string | null;
            id: string;
        } | null;
    } & {
        status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        organizationId: string;
        tenantUserId: string;
        category: import("@prisma/client").$Enums.MaintenanceTicketCategory;
        bedId: string | null;
        title: string;
        description: string;
        priority: import("@prisma/client").$Enums.MaintenanceTicketPriority;
        assignedToUserId: string | null;
        resolutionSummary: string | null;
        resolutionCostMinor: number | null;
        resolvedAt: Date | null;
        resolutionRating: number | null;
        resolutionFeedback: string | null;
        ratedAt: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getMaintenanceTicketForOrg(organizationId: string, ticketId: string): Promise<({
    bed: {
        id: string;
        label: string;
        room: {
            name: string;
            floor: {
                name: string;
            };
        };
    } | null;
    tenant: {
        name: string | null;
        id: string;
        phone: string | null;
    };
    assignee: {
        name: string | null;
        id: string;
        phone: string | null;
    } | null;
    attachments: {
        id: string;
        createdAt: Date;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        ticketId: string;
        uploadedByUserId: string;
    }[];
} & {
    status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    organizationId: string;
    tenantUserId: string;
    category: import("@prisma/client").$Enums.MaintenanceTicketCategory;
    bedId: string | null;
    title: string;
    description: string;
    priority: import("@prisma/client").$Enums.MaintenanceTicketPriority;
    assignedToUserId: string | null;
    resolutionSummary: string | null;
    resolutionCostMinor: number | null;
    resolvedAt: Date | null;
    resolutionRating: number | null;
    resolutionFeedback: string | null;
    ratedAt: Date | null;
}) | null>;
export declare function getMaintenanceTicketForTenant(organizationId: string, ticketId: string, tenantUserId: string): Promise<{
    bed: {
        label: string;
        room: {
            name: string;
            floor: {
                name: string;
            };
        };
    } | null;
    assignee: {
        name: string | null;
        id: string;
    } | null;
    attachments: {
        id: string;
        createdAt: Date;
        originalFilename: string;
        mimeType: string;
        byteSize: number;
        cloudinaryPublicId: string;
        ticketId: string;
        uploadedByUserId: string;
    }[];
} & {
    status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    organizationId: string;
    tenantUserId: string;
    category: import("@prisma/client").$Enums.MaintenanceTicketCategory;
    bedId: string | null;
    title: string;
    description: string;
    priority: import("@prisma/client").$Enums.MaintenanceTicketPriority;
    assignedToUserId: string | null;
    resolutionSummary: string | null;
    resolutionCostMinor: number | null;
    resolvedAt: Date | null;
    resolutionRating: number | null;
    resolutionFeedback: string | null;
    ratedAt: Date | null;
}>;
export declare function getMaintenanceTimeline(params: {
    ticketId: string;
    organizationId: string;
    viewerUserId: string;
    viewerIsStaff: boolean;
}): Promise<{
    entries: ({
        kind: "activity";
        createdAt: Date;
        data: {
            actor: {
                name: string | null;
                id: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            actorUserId: string | null;
            payload: Prisma.JsonValue | null;
            ticketId: string;
            activityType: string;
        };
    } | {
        kind: "message";
        createdAt: Date;
        data: {
            author: {
                name: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            ticketId: string;
            authorUserId: string;
            body: string;
            visibility: import("@prisma/client").$Enums.MaintenanceMessageVisibility;
        };
    })[];
}>;
export declare function patchMaintenanceTicketStaff(params: {
    organizationId: string;
    ticketId: string;
    actorUserId: string;
    assignedToUserId: string | null;
}): Promise<void>;
export declare function patchMaintenanceTicketStatus(params: {
    organizationId: string;
    ticketId: string;
    actorUserId: string;
    status: MaintenanceTicketStatus;
    resolutionSummary?: string | null;
}): Promise<void>;
export declare function patchMaintenanceTicketMeta(params: {
    organizationId: string;
    ticketId: string;
    actorUserId: string;
    priority?: MaintenanceTicketPriority;
    resolutionCostMinor?: number | null;
}): Promise<void>;
export declare function addMaintenanceMessage(params: {
    organizationId: string;
    ticketId: string;
    authorUserId: string;
    body: string;
    visibility: MaintenanceMessageVisibility;
    authorIsStaff: boolean;
}): Promise<{
    id: string;
}>;
export declare function submitMaintenanceRating(params: {
    organizationId: string;
    ticketId: string;
    tenantUserId: string;
    rating: number;
    feedback?: string | null;
}): Promise<void>;
export declare function addMaintenanceAttachment(params: {
    organizationId: string;
    ticketId: string;
    uploaderUserId: string;
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
    uploaderIsStaff: boolean;
}): Promise<{
    id: string;
    publicId: string;
}>;
export declare function listMaintenanceStaffAssignees(organizationId: string): Promise<{
    userId: string;
    orgRole: import("@prisma/client").$Enums.OrgRole;
    user: {
        name: string | null;
        id: string;
        phone: string | null;
    };
}[]>;
export declare function getMaintenanceAttachmentSignedUrl(params: {
    organizationId: string;
    ticketId: string;
    attachmentId: string;
    requesterUserId: string;
    requesterIsStaff: boolean;
}): Promise<{
    url: string;
}>;
export declare function getMaintenanceMetrics(params: {
    organizationId: string;
    from: Date;
    to: Date;
}): Promise<{
    resolvedCount: number;
    avgResolutionHours: number | null;
    avgCostMinor: number | null;
    avgRating: number | null;
    byCategory: Record<string, number>;
}>;
