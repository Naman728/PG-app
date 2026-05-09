import type { Prisma, TenantDocumentCategory, TenantLifecycleStatus } from "@prisma/client";
import { OrgRole } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

export type TenantListQuery = {
  page: number;
  pageSize: number;
  status?: TenantLifecycleStatus;
  q?: string;
};

export class TenantRepository {
  findMembershipTenantOrg(userId: string) {
    return prisma.organizationMember.findFirst({
      where: { userId, orgRole: OrgRole.TENANT, organization: { deletedAt: null } },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
  }

  findTenantByOrgUser(organizationId: string, userId: string) {
    return prisma.tenant.findFirst({
      where: { organizationId, userId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        emergencyContacts: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  findTenantByIdForOrg(tenantId: string, organizationId: string) {
    return prisma.tenant.findFirst({
      where: { id: tenantId, organizationId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        emergencyContacts: {
          where: { deletedAt: null },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  async listTenantsForOrg(organizationId: string, query: TenantListQuery) {
    const where: Prisma.TenantWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (query.status) {
      where.status = query.status;
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { user: { phone: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);
    return { items, total };
  }

  createTenant(data: Prisma.TenantCreateInput) {
    return prisma.tenant.create({ data });
  }

  upsertTenantOnboarding(organizationId: string, userId: string) {
    return prisma.tenant.upsert({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      create: {
        organization: { connect: { id: organizationId } },
        user: { connect: { id: userId } },
      },
      update: {},
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        documents: { where: { deletedAt: null } },
        emergencyContacts: { where: { deletedAt: null } },
      },
    });
  }

  updateTenant(id: string, data: Prisma.TenantUpdateInput) {
    return prisma.tenant.update({ where: { id }, data });
  }

  findDocumentForTenant(docId: string, tenantId: string) {
    return prisma.tenantDocument.findFirst({
      where: { id: docId, tenantId, deletedAt: null },
      include: { tenant: { select: { userId: true } } },
    });
  }

  findDocumentForOrg(docId: string, organizationId: string) {
    return prisma.tenantDocument.findFirst({
      where: { id: docId, organizationId, deletedAt: null },
      include: { tenant: { select: { userId: true } } },
    });
  }

  createDocument(data: Prisma.TenantDocumentCreateInput) {
    return prisma.tenantDocument.create({ data });
  }

  softDeleteDocument(id: string) {
    return prisma.tenantDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  updateDocument(id: string, data: Prisma.TenantDocumentUpdateInput) {
    return prisma.tenantDocument.update({ where: { id }, data });
  }

  countDocumentsByTenant(tenantId: string) {
    return prisma.tenantDocument.count({
      where: { tenantId, deletedAt: null },
    });
  }

  hasCategory(tenantId: string, category: TenantDocumentCategory) {
    return prisma.tenantDocument.findFirst({
      where: { tenantId, category, deletedAt: null },
      select: { id: true },
    });
  }

  createEmergencyContact(data: Prisma.TenantEmergencyContactCreateInput) {
    return prisma.tenantEmergencyContact.create({ data });
  }

  findEmergencyContact(id: string, tenantId: string) {
    return prisma.tenantEmergencyContact.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  updateEmergencyContact(id: string, data: Prisma.TenantEmergencyContactUpdateInput) {
    return prisma.tenantEmergencyContact.update({ where: { id }, data });
  }

  softDeleteEmergencyContact(id: string) {
    return prisma.tenantEmergencyContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  countEmergencyContacts(tenantId: string) {
    return prisma.tenantEmergencyContact.count({
      where: { tenantId, deletedAt: null },
    });
  }

  findBedAssignment(organizationId: string, tenantUserId: string) {
    return prisma.bed.findFirst({
      where: {
        tenantUserId,
        deletedAt: null,
        room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
      },
      include: {
        room: {
          include: {
            floor: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  listHistory(organizationId: string, tenantUserId: string, take: number, skip: number) {
    return prisma.tenantHistory.findMany({
      where: { organizationId, tenantUserId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        createdBy: { select: { id: true, name: true, phone: true } },
      },
    });
  }

  countHistory(organizationId: string, tenantUserId: string) {
    return prisma.tenantHistory.count({
      where: { organizationId, tenantUserId },
    });
  }

  appendHistory(data: Prisma.TenantHistoryCreateInput) {
    return prisma.tenantHistory.create({ data });
  }
}
