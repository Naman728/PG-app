import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";
import type { LoginInput, RegisterInput } from "@pg-manager/shared";
import { badRequest, forbidden, unauthorized } from "../../common/httpErrors.js";
import { loadEnv } from "../../config/env.js";
import { AuthRepository } from "./auth.repository.js";
import { createRefreshTokenValue, hashRefreshToken } from "./cryptoTokens.js";
import { hashPassword, verifyPassword } from "./password.util.js";
import { signAccessToken } from "./token.service.js";

export class AuthService {
  constructor(private readonly repo = new AuthRepository()) {}

  async issueSessionTokens(
    user: User,
    meta: { userAgent?: string | null; ip?: string | null },
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshRaw = createRefreshTokenValue();
    const tokenHash = hashRefreshToken(refreshRaw);
    const env = loadEnv();
    const expiresAt = new Date(
      Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.repo.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    });

    return { user, accessToken, refreshToken: refreshRaw };
  }

  async register(
    input: RegisterInput,
    meta: { userAgent?: string | null; ip?: string | null },
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(email);
    if (existing) {
      throw badRequest("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    let user = await this.repo.createUser({
      email,
      passwordHash,
      name: input.name ?? null,
      role: UserRole.OWNER,
      phoneVerified: false,
    });

    const memberships = await this.repo.countMemberships(user.id);
    if (memberships === 0) {
      const label = user.name?.trim() ? `${user.name.trim()}'s PG` : "My PG";
      await this.repo.createOrganizationWithOwnerMembership({
        userId: user.id,
        orgName: label,
      });
    }

    user = (await this.repo.findUserById(user.id))!;
    return this.issueSessionTokens(user, meta);
  }

  async login(
    input: LoginInput,
    meta: { userAgent?: string | null; ip?: string | null },
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const email = input.email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(email);
    if (!user?.passwordHash) {
      throw unauthorized("Invalid email or password");
    }
    if (user.deletedAt) {
      throw forbidden("This account is deactivated. Contact support.");
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      throw unauthorized("Invalid email or password");
    }

    const updated = await this.repo.updateUser(user.id, {
      lastLoginAt: new Date(),
    });
    return this.issueSessionTokens(updated, meta);
  }

  async refreshSession(
    refreshToken: string | undefined,
    meta: { userAgent?: string | null; ip?: string | null },
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw unauthorized("Missing refresh session");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const record = await this.repo.findRefreshTokenByHash(tokenHash);
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw unauthorized("Invalid or expired session");
    }

    const user = record.user;
    if (user.deletedAt) {
      throw forbidden("This account is deactivated.");
    }

    await this.repo.revokeRefreshToken(record.id);

    return this.issueSessionTokens(user, meta);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = hashRefreshToken(refreshToken);
    const record = await this.repo.findRefreshTokenByHash(tokenHash);
    if (record && !record.revokedAt) {
      await this.repo.revokeRefreshToken(record.id);
    }
  }
}
