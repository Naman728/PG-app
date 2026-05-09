import { prisma } from "../../prisma/client.js";
export class AuthRepository {
    async countRecentOtpChallenges(phone, since) {
        return prisma.otpChallenge.count({
            where: { phone, createdAt: { gte: since } },
        });
    }
    async expireOpenChallenges(phone) {
        await prisma.otpChallenge.updateMany({
            where: { phone, consumedAt: null },
            data: { consumedAt: new Date() },
        });
    }
    async createOtpChallenge(data) {
        return prisma.otpChallenge.create({ data });
    }
    async findLatestOpenChallenge(phone) {
        return prisma.otpChallenge.findFirst({
            where: {
                phone,
                consumedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async incrementChallengeAttempts(id) {
        return prisma.otpChallenge.update({
            where: { id },
            data: { attemptCount: { increment: 1 } },
        });
    }
    async consumeChallenge(id) {
        return prisma.otpChallenge.update({
            where: { id },
            data: { consumedAt: new Date() },
        });
    }
    async findUserByPhone(phone) {
        return prisma.user.findFirst({
            where: { phone, deletedAt: null },
        });
    }
    async findUserByEmail(email) {
        const normalized = email.trim().toLowerCase();
        return prisma.user.findFirst({
            where: { email: normalized, deletedAt: null },
        });
    }
    async findUserById(id) {
        return prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async createUser(data) {
        return prisma.user.create({ data });
    }
    async updateUser(id, data) {
        return prisma.user.update({ where: { id }, data });
    }
    async countMemberships(userId) {
        return prisma.organizationMember.count({
            where: { userId, organization: { deletedAt: null } },
        });
    }
    async createOrganizationWithOwnerMembership(params) {
        return prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: { name: params.orgName, city: "Bengaluru" },
            });
            await tx.organizationMember.create({
                data: {
                    organizationId: org.id,
                    userId: params.userId,
                    orgRole: "OWNER",
                },
            });
            return org;
        });
    }
    async createRefreshToken(data) {
        return prisma.refreshToken.create({ data });
    }
    async findRefreshTokenByHash(tokenHash) {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });
    }
    async revokeRefreshToken(id) {
        return prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllUserRefreshTokens(userId) {
        return prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
}
//# sourceMappingURL=auth.repository.js.map