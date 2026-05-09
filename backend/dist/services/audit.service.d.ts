import type { Prisma } from "@prisma/client";
/**
 * Best-effort security audit trail. Never throws — failures are logged.
 */
export declare function writeAuditLog(params: {
    organizationId?: string | null;
    actorUserId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ip?: string | null;
    userAgent?: string | null;
}): Promise<void>;
