import { MaintenanceTicketStatus } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
const ACTIVE_MAINTENANCE = [
    MaintenanceTicketStatus.OPEN,
    MaintenanceTicketStatus.ACKNOWLEDGED,
    MaintenanceTicketStatus.IN_PROGRESS,
    MaintenanceTicketStatus.BLOCKED,
];
const bedTenantSelect = {
    id: true,
    name: true,
    phone: true,
    email: true,
};
/**
 * Single round-trip property graph for floor map + vacancy.
 * Includes recent rent invoices and open maintenance per bed (no N+1).
 */
export class FloorMapRepository {
    async loadPropertyGraph(organizationId) {
        return prisma.floor.findMany({
            where: { organizationId, deletedAt: null },
            orderBy: { sortOrder: "asc" },
            select: {
                id: true,
                name: true,
                sortOrder: true,
                gridColumns: true,
                rooms: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: "asc" },
                    select: {
                        id: true,
                        name: true,
                        sharingLabel: true,
                        colStart: true,
                        colSpan: true,
                        rowStart: true,
                        rowSpan: true,
                        sortOrder: true,
                        beds: {
                            where: { deletedAt: null },
                            orderBy: { label: "asc" },
                            select: {
                                id: true,
                                label: true,
                                status: true,
                                monthlyRentMinor: true,
                                tenantUserId: true,
                                paidThrough: true,
                                maintenanceNote: true,
                                assignedAt: true,
                                createdAt: true,
                                updatedAt: true,
                                tenant: { select: bedTenantSelect },
                                rentInvoices: {
                                    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
                                    take: 12,
                                    select: {
                                        id: true,
                                        status: true,
                                        dueDate: true,
                                        billingYear: true,
                                        billingMonth: true,
                                        amountMinor: true,
                                    },
                                },
                                maintenanceTickets: {
                                    where: {
                                        deletedAt: null,
                                        status: { in: ACTIVE_MAINTENANCE },
                                    },
                                    select: { id: true, status: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    async loadRoomWithBeds(organizationId, roomId) {
        return prisma.room.findFirst({
            where: {
                id: roomId,
                deletedAt: null,
                floor: { organizationId, deletedAt: null },
            },
            select: {
                id: true,
                name: true,
                sharingLabel: true,
                colStart: true,
                colSpan: true,
                rowStart: true,
                rowSpan: true,
                sortOrder: true,
                floor: { select: { id: true, name: true } },
                beds: {
                    where: { deletedAt: null },
                    orderBy: { label: "asc" },
                    select: {
                        id: true,
                        label: true,
                        status: true,
                        monthlyRentMinor: true,
                        tenantUserId: true,
                        paidThrough: true,
                        maintenanceNote: true,
                        assignedAt: true,
                        createdAt: true,
                        updatedAt: true,
                        tenant: { select: bedTenantSelect },
                        rentInvoices: {
                            orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
                            take: 12,
                            select: {
                                id: true,
                                status: true,
                                dueDate: true,
                                billingYear: true,
                                billingMonth: true,
                                amountMinor: true,
                            },
                        },
                        maintenanceTickets: {
                            where: {
                                deletedAt: null,
                                status: { in: ACTIVE_MAINTENANCE },
                            },
                            select: { id: true, status: true, title: true, createdAt: true },
                        },
                    },
                },
            },
        });
    }
    async assertOrganizationExists(organizationId) {
        return prisma.organization.findFirst({
            where: { id: organizationId, deletedAt: null },
            select: { id: true },
        });
    }
}
//# sourceMappingURL=floor-map.repository.js.map