import { OrgRole, UserRole, } from "@prisma/client";
import { badRequest, forbidden, notFound, } from "../../common/httpErrors.js";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../../prisma/client.js";
import { sendOtpMessage, sendPlainSms } from "../../services/twilio.service.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { AuthService } from "../auth/auth.service.js";
import { createInviteTokenValue, generateNumericOtp, hashOtp, hashRefreshToken, verifyOtp, } from "../auth/cryptoTokens.js";
import { TenantInvitationRepository } from "./tenant-invitation.repository.js";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
function maskPhone(phone) {
    if (phone.length <= 6)
        return "****";
    return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
}
export class TenantInvitationService {
    invites;
    authRepo;
    authService;
    constructor(invites = new TenantInvitationRepository(), authRepo = new AuthRepository(), authService = new AuthService()) {
        this.invites = invites;
        this.authRepo = authRepo;
        this.authService = authService;
    }
    resolveTokenHash(rawToken) {
        if (!/^[a-f0-9]{48}$/.test(rawToken)) {
            throw badRequest("Invalid invitation link");
        }
        return hashRefreshToken(rawToken);
    }
    async previewInvite(rawToken) {
        const tokenHash = this.resolveTokenHash(rawToken);
        const invite = await this.invites.findActiveByTokenHash(tokenHash);
        if (!invite) {
            throw notFound("Invitation not found or expired");
        }
        return {
            organizationName: invite.organization.name,
            city: invite.organization.city,
            phoneMasked: maskPhone(invite.phone),
        };
    }
    async requestInviteOtp(rawToken) {
        const tokenHash = this.resolveTokenHash(rawToken);
        const invite = await this.invites.findActiveByTokenHash(tokenHash);
        if (!invite) {
            throw notFound("Invitation not found or expired");
        }
        await this.authRepo.expireOpenChallenges(invite.phone);
        const code = generateNumericOtp(6);
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        await this.authRepo.createOtpChallenge({
            phone: invite.phone,
            codeHash,
            channel: "sms",
            expiresAt,
            userId: null,
        });
        await sendOtpMessage({
            phone: invite.phone,
            channel: "sms",
            code,
        });
        return { sent: true, expiresInSec: OTP_TTL_MS / 1000 };
    }
    async verifyInviteOtp(rawToken, input, meta) {
        const tokenHash = this.resolveTokenHash(rawToken);
        const invite = await this.invites.findActiveByTokenHash(tokenHash);
        if (!invite) {
            throw notFound("Invitation not found or expired");
        }
        const challenge = await this.authRepo.findLatestOpenChallenge(invite.phone);
        if (!challenge) {
            throw badRequest("Invalid or expired OTP");
        }
        if (challenge.attemptCount >= MAX_OTP_ATTEMPTS) {
            throw badRequest("Too many incorrect attempts. Request a new OTP.");
        }
        if (!verifyOtp(input.code, challenge.codeHash)) {
            await this.authRepo.incrementChallengeAttempts(challenge.id);
            throw badRequest("Invalid OTP");
        }
        await this.authRepo.consumeChallenge(challenge.id);
        const result = await prisma.$transaction(async (tx) => {
            const lockedInvite = await tx.tenantInvitation.findFirst({
                where: { id: invite.id, consumedAt: null },
            });
            if (!lockedInvite) {
                throw badRequest("Invitation already used");
            }
            const existingMember = await tx.organizationMember.findFirst({
                where: {
                    organizationId: lockedInvite.organizationId,
                    user: { phone: lockedInvite.phone },
                },
            });
            if (existingMember) {
                throw badRequest("This number is already linked to this PG");
            }
            let user = await tx.user.findFirst({
                where: { phone: lockedInvite.phone, deletedAt: null },
            });
            if (user) {
                if (user.role === UserRole.OWNER || user.role === UserRole.STAFF) {
                    throw forbidden("This phone is registered as owner/staff. Use owner login.");
                }
                user = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        phoneVerified: true,
                        lastLoginAt: new Date(),
                        role: UserRole.TENANT,
                    },
                });
            }
            else {
                user = await tx.user.create({
                    data: {
                        phone: lockedInvite.phone,
                        role: UserRole.TENANT,
                        phoneVerified: true,
                        lastLoginAt: new Date(),
                    },
                });
            }
            await tx.organizationMember.upsert({
                where: {
                    organizationId_userId: {
                        organizationId: lockedInvite.organizationId,
                        userId: user.id,
                    },
                },
                create: {
                    organizationId: lockedInvite.organizationId,
                    userId: user.id,
                    orgRole: OrgRole.TENANT,
                },
                update: { orgRole: OrgRole.TENANT },
            });
            await tx.tenantInvitation.update({
                where: { id: lockedInvite.id },
                data: { consumedAt: new Date() },
            });
            await tx.tenant.upsert({
                where: {
                    organizationId_userId: {
                        organizationId: lockedInvite.organizationId,
                        userId: user.id,
                    },
                },
                create: {
                    organizationId: lockedInvite.organizationId,
                    userId: user.id,
                },
                update: {},
            });
            await tx.tenantHistory.create({
                data: {
                    organizationId: lockedInvite.organizationId,
                    tenantUserId: user.id,
                    eventType: "INVITE_ACCEPTED",
                    payload: { invitationId: lockedInvite.id },
                    createdByUserId: lockedInvite.invitedByUserId,
                },
            });
            await tx.auditLog.create({
                data: {
                    organizationId: lockedInvite.organizationId,
                    actorUserId: user.id,
                    action: "TENANT_INVITE_ACCEPTED",
                    entityType: "TenantInvitation",
                    entityId: lockedInvite.id,
                    ip: meta.ip ?? null,
                    userAgent: meta.userAgent ?? null,
                },
            });
            return user;
        });
        return this.authService.issueSessionTokens(result, meta);
    }
    async createInvite(params) {
        const { organizationId, invitedByUserId, input, inviterDisplayName } = params;
        const existingUser = await prisma.user.findFirst({
            where: { phone: input.phone, deletedAt: null },
        });
        if (existingUser) {
            const member = await prisma.organizationMember.findFirst({
                where: { organizationId, userId: existingUser.id },
            });
            if (member) {
                throw badRequest("This user is already part of your PG");
            }
            if (existingUser.role === UserRole.OWNER || existingUser.role === UserRole.STAFF) {
                throw badRequest("This phone belongs to an owner/staff account");
            }
        }
        await this.invites.expirePendingForPhoneOrg(organizationId, input.phone);
        const rawToken = createInviteTokenValue();
        const tokenHash = hashRefreshToken(rawToken);
        const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
        const invite = await this.invites.create({
            organizationId,
            phone: input.phone,
            invitedByUserId,
            tokenHash,
            expiresAt,
        });
        const org = await prisma.organization.findFirst({
            where: { id: organizationId, deletedAt: null },
        });
        if (!org) {
            throw notFound("Organization not found");
        }
        const env = loadEnv();
        const joinUrl = `${env.FRONTEND_URL.replace(/\/$/, "")}/join/${rawToken}`;
        const inviterLabel = inviterDisplayName || "Your PG owner";
        const smsBody = `${inviterLabel} invited you to ${org.name} on PG Manager. Open ${joinUrl} to sign in with OTP (SMS).`;
        await sendPlainSms({ to: input.phone, body: smsBody });
        await prisma.auditLog.create({
            data: {
                organizationId,
                actorUserId: invitedByUserId,
                action: "TENANT_INVITE_CREATED",
                entityType: "TenantInvitation",
                entityId: invite.id,
                metadata: { phone: input.phone },
            },
        });
        return { id: invite.id, expiresAt: invite.expiresAt, joinUrl };
    }
    async listPending(organizationId) {
        return this.invites.listPendingForOrg(organizationId);
    }
}
//# sourceMappingURL=tenant-invitation.service.js.map