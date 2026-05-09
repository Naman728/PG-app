import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { logger } from "./logger.service.js";

/**
 * Creates an in-app notification. Best-effort — logs and swallows DB errors so
 * outbound jobs (WhatsApp/SMS) are not blocked by notification insert failures.
 */
export async function createInAppNotification(params: {
  userId: string;
  organizationId: string;
  category: string;
  title: string;
  body: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await prisma.inAppNotification.create({
      data: {
        userId: params.userId,
        organizationId: params.organizationId,
        category: params.category,
        title: params.title,
        body: params.body,
        metadata: params.metadata,
      },
    });
  } catch (err) {
    logger.error({ message: "in_app_notification_create_failed", err, category: params.category });
  }
}
