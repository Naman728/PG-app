import { prisma } from "../prisma/client.js";
import { logger } from "./logger.service.js";
/**
 * Best-effort security audit trail. Never throws — failures are logged.
 */
export async function writeAuditLog(params) {
    try {
        await prisma.auditLog.create({
            data: {
                organizationId: params.organizationId ?? undefined,
                actorUserId: params.actorUserId ?? undefined,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId ?? undefined,
                metadata: params.metadata,
                ip: params.ip ?? undefined,
                userAgent: params.userAgent ?? undefined,
            },
        });
    }
    catch (err) {
        logger.error({ message: "audit_log_write_failed", err, action: params.action });
    }
}
//# sourceMappingURL=audit.service.js.map