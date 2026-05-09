import { sendSuccess } from "../../common/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { prisma } from "../../prisma/client.js";
export const listInAppNotifications = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const userId = req.auth.userId;
    const take = Math.min(100, Math.max(1, Number(req.query.take ?? 40)));
    const [items, unread] = await Promise.all([
        prisma.inAppNotification.findMany({
            where: { userId, organizationId: orgId },
            orderBy: { createdAt: "desc" },
            take,
            select: {
                id: true,
                category: true,
                title: true,
                body: true,
                readAt: true,
                createdAt: true,
                metadata: true,
            },
        }),
        prisma.inAppNotification.count({
            where: { userId, organizationId: orgId, readAt: null },
        }),
    ]);
    sendSuccess(res, { items, unread });
});
export const markInAppNotificationRead = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const id = req.params.notificationId;
    const userId = req.auth.userId;
    await prisma.inAppNotification.updateMany({
        where: { id, userId, organizationId: orgId, readAt: null },
        data: { readAt: new Date() },
    });
    sendSuccess(res, { ok: true });
});
export const markAllInAppNotificationsRead = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const userId = req.auth.userId;
    await prisma.inAppNotification.updateMany({
        where: { userId, organizationId: orgId, readAt: null },
        data: { readAt: new Date() },
    });
    sendSuccess(res, { ok: true });
});
//# sourceMappingURL=in-app.controller.js.map