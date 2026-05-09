import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";

export class AuthRepository {
  async countRecentOtpChallenges(phone: string, since: Date): Promise<number> {
    return prisma.otpChallenge.count({
      where: { phone, createdAt: { gte: since } },
    });
  }

  async expireOpenChallenges(phone: string): Promise<void> {
    await prisma.otpChallenge.updateMany({
      where: { phone, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  async createOtpChallenge(data: {
    phone: string;
    codeHash: string;
    channel: string;
    expiresAt: Date;
    userId?: string | null;
  }) {
    return prisma.otpChallenge.create({ data });
  }

  async findLatestOpenChallenge(phone: string) {
    return prisma.otpChallenge.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async incrementChallengeAttempts(id: string) {
    return prisma.otpChallenge.update({
      where: { id },
      data: { attemptCount: { increment: 1 } },
    });
  }

  async consumeChallenge(id: string) {
    return prisma.otpChallenge.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async findUserByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone, deletedAt: null },
    });
  }

  async findUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return prisma.user.findFirst({
      where: { email: normalized, deletedAt: null },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async countMemberships(userId: string) {
    return prisma.organizationMember.count({
      where: { userId, organization: { deletedAt: null } },
    });
  }

  async createOrganizationWithOwnerMembership(params: {
    userId: string;
    orgName: string;
  }) {
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

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ip?: string | null;
  }) {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
