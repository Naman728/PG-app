import { OrgRole } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
export class TenantRepository {
    findMembershipTenantOrg(userId) {
        return prisma.organizationMember.findFirst({
            where: { userId, orgRole: OrgRole.TENANT, organization: { deletedAt: null } },
            include: { organization: true },
            orderBy: { createdAt: "asc" },
        });
    }
    findTenantByOrgUser(organizationId, userId) {
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
    findTenantByIdForOrg(tenantId, organizationId) {
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
    async listTenantsForOrg(organizationId, query) {
        const where = {
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
    createTenant(data) {
        return prisma.tenant.create({ data });
    }
    upsertTenantOnboarding(organizationId, userId) {
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
    updateTenant(id, data) {
        return prisma.tenant.update({ where: { id }, data });
    }
    findDocumentForTenant(docId, tenantId) {
        return prisma.tenantDocument.findFirst({
            where: { id: docId, tenantId, deletedAt: null },
            include: { tenant: { select: { userId: true } } },
        });
    }
    findDocumentForOrg(docId, organizationId) {
        return prisma.tenantDocument.findFirst({
            where: { id: docId, organizationId, deletedAt: null },
            include: { tenant: { select: { userId: true } } },
        });
    }
    createDocument(data) {
        return prisma.tenantDocument.create({ data });
    }
    softDeleteDocument(id) {
        return prisma.tenantDocument.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    updateDocument(id, data) {
        return prisma.tenantDocument.update({ where: { id }, data });
    }
    countDocumentsByTenant(tenantId) {
        return prisma.tenantDocument.count({
            where: { tenantId, deletedAt: null },
        });
    }
    hasCategory(tenantId, category) {
        return prisma.tenantDocument.findFirst({
            where: { tenantId, category, deletedAt: null },
            select: { id: true },
        });
    }
    createEmergencyContact(data) {
        return prisma.tenantEmergencyContact.create({ data });
    }
    findEmergencyContact(id, tenantId) {
        return prisma.tenantEmergencyContact.findFirst({
            where: { id, tenantId, deletedAt: null },
        });
    }
    updateEmergencyContact(id, data) {
        return prisma.tenantEmergencyContact.update({ where: { id }, data });
    }
    softDeleteEmergencyContact(id) {
        return prisma.tenantEmergencyContact.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    countEmergencyContacts(tenantId) {
        return prisma.tenantEmergencyContact.count({
            where: { tenantId, deletedAt: null },
        });
    }
    findBedAssignment(organizationId, tenantUserId) {
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
    listHistory(organizationId, tenantUserId, take, skip) {
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
    countHistory(organizationId, tenantUserId) {
        return prisma.tenantHistory.count({
            where: { organizationId, tenantUserId },
        });
    }
    appendHistory(data) {
        return prisma.tenantHistory.create({ data });
    }
}
//# sourceMappingURL=tenant.repository.js.map