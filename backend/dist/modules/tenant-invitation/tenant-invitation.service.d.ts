import type { InvitationVerifyOtpInput, InviteTenantInput } from "@pg-manager/shared";
import { AuthRepository } from "../auth/auth.repository.js";
import { AuthService } from "../auth/auth.service.js";
import { TenantInvitationRepository } from "./tenant-invitation.repository.js";
export declare class TenantInvitationService {
    private readonly invites;
    private readonly authRepo;
    private readonly authService;
    constructor(invites?: TenantInvitationRepository, authRepo?: AuthRepository, authService?: AuthService);
    private resolveTokenHash;
    previewInvite(rawToken: string): Promise<{
        organizationName: string;
        city: string;
        phoneMasked: string;
    }>;
    requestInviteOtp(rawToken: string): Promise<{
        sent: boolean;
        expiresInSec: number;
    }>;
    verifyInviteOtp(rawToken: string, input: InvitationVerifyOtpInput, meta: {
        userAgent?: string | null;
        ip?: string | null;
    }): Promise<{
        user: import("@prisma/client").User;
        accessToken: string;
        refreshToken: string;
    }>;
    createInvite(params: {
        organizationId: string;
        invitedByUserId: string;
        input: InviteTenantInput;
        inviterDisplayName: string;
    }): Promise<{
        id: string;
        expiresAt: Date;
        joinUrl: string;
    }>;
    listPending(organizationId: string): Promise<{
        id: string;
        phone: string;
        createdAt: Date;
        expiresAt: Date;
        invitedBy: {
            name: string | null;
            id: string;
            phone: string | null;
        };
    }[]>;
}
