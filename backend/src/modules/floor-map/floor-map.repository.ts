import { MaintenanceTicketStatus, type Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

const ACTIVE_MAINTENANCE: MaintenanceTicketStatus[] = [
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
} satisfies Prisma.UserSelect;

/**
 * Single round-trip property graph for floor map + vacancy.
 * Includes recent rent invoices and open maintenance per bed (no N+1).
 */
export class FloorMapRepository {
  async loadPropertyGraph(organizationId: string) {
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

  async loadRoomWithBeds(organizationId: string, roomId: string) {
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

  async assertOrganizationExists(organizationId: string) {
    return prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true },
    });
  }
}

export type PropertyGraphFloor = Awaited<ReturnType<FloorMapRepository["loadPropertyGraph"]>>[number];
