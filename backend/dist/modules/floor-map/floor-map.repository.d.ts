/**
 * Single round-trip property graph for floor map + vacancy.
 * Includes recent rent invoices and open maintenance per bed (no N+1).
 */
export declare class FloorMapRepository {
    loadPropertyGraph(organizationId: string): Promise<{
        name: string;
        id: string;
        sortOrder: number;
        gridColumns: number;
        rooms: {
            name: string;
            id: string;
            sortOrder: number;
            sharingLabel: string | null;
            colStart: number;
            colSpan: number;
            rowStart: number;
            rowSpan: number;
            beds: {
                status: import("@prisma/client").$Enums.BedStatus;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantUserId: string | null;
                label: string;
                monthlyRentMinor: number;
                paidThrough: Date | null;
                maintenanceNote: string | null;
                assignedAt: Date | null;
                tenant: {
                    name: string | null;
                    id: string;
                    phone: string | null;
                    email: string | null;
                } | null;
                rentInvoices: {
                    status: import("@prisma/client").$Enums.RentInvoiceStatus;
                    id: string;
                    billingYear: number;
                    billingMonth: number;
                    amountMinor: number;
                    dueDate: Date;
                }[];
                maintenanceTickets: {
                    status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
                    id: string;
                }[];
            }[];
        }[];
    }[]>;
    loadRoomWithBeds(organizationId: string, roomId: string): Promise<{
        name: string;
        id: string;
        floor: {
            name: string;
            id: string;
        };
        sortOrder: number;
        sharingLabel: string | null;
        colStart: number;
        colSpan: number;
        rowStart: number;
        rowSpan: number;
        beds: {
            status: import("@prisma/client").$Enums.BedStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantUserId: string | null;
            label: string;
            monthlyRentMinor: number;
            paidThrough: Date | null;
            maintenanceNote: string | null;
            assignedAt: Date | null;
            tenant: {
                name: string | null;
                id: string;
                phone: string | null;
                email: string | null;
            } | null;
            rentInvoices: {
                status: import("@prisma/client").$Enums.RentInvoiceStatus;
                id: string;
                billingYear: number;
                billingMonth: number;
                amountMinor: number;
                dueDate: Date;
            }[];
            maintenanceTickets: {
                status: import("@prisma/client").$Enums.MaintenanceTicketStatus;
                id: string;
                createdAt: Date;
                title: string;
            }[];
        }[];
    } | null>;
    assertOrganizationExists(organizationId: string): Promise<{
        id: string;
    } | null>;
}
export type PropertyGraphFloor = Awaited<ReturnType<FloorMapRepository["loadPropertyGraph"]>>[number];
