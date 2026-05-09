import type { Prisma } from "@prisma/client";
/**
 * Creates an in-app notification. Best-effort — logs and swallows DB errors so
 * outbound jobs (WhatsApp/SMS) are not blocked by notification insert failures.
 */
export declare function createInAppNotification(params: {
    userId: string;
    organizationId: string;
    category: string;
    title: string;
    body: string;
    metadata?: Prisma.InputJsonValue;
}): Promise<void>;
