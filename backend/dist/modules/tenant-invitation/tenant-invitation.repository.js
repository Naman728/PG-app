import { prisma } from "../../prisma/client.js";
export class TenantInvitationRepository {
    async expirePendingForPhoneOrg(organizationId, phone) {
        await prisma.tenantInvitation.updateMany({
            where: { organizationId, phone, consumedAt: null },
            data: { consumedAt: new Date() },
        });
    }
    async create(data) {
        return prisma.tenantInvitation.create({ data });
    }
    async findActiveByTokenHash(tokenHash) {
        return prisma.tenantInvitation.findFirst({
            where: {
                tokenHash,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { organization: true, invitedBy: true },
        });
    }
    async consume(id) {
        return prisma.tenantInvitation.update({
            where: { id },
            data: { consumedAt: new Date() },
        });
    }
    async listPendingForOrg(organizationId) {
        return prisma.tenantInvitation.findMany({
            where: { organizationId, consumedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                phone: true,
                createdAt: true,
                expiresAt: true,
                invitedBy: { select: { id: true, name: true, phone: true } },
            },
        });
    }
}
//# sourceMappingURL=tenant-invitation.repository.js.map