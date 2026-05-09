import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { OrgRole, UserRole } from "@prisma/client";
import { sendSuccess } from "../../common/apiResponse.js";
import { requireOrgRoles } from "../../middleware/orgAccess.middleware.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRoles } from "../../middleware/roles.middleware.js";
import { validateBody } from "../../middleware/validateDto.js";
import { updateOrganizationProfile } from "../../modules/organization/organization.controller.js";
import { getFloorMap, getRoomOperationalDetails } from "../../modules/floor-map/floor-map.controller.js";
import { assignBed, bulkPropertySetup, createBed, createFloor, createRoom, deleteBed, deleteFloor, deleteRoom, getPropertyMap, getPropertyStats, listPropertyTenantMembers, markBedPaid, updateBed, updateFloor, updateRoom, vacateBed, } from "../../modules/property/property.controller.js";
import { getVacancyRooms, getVacancySummary } from "../../modules/vacancy/vacancy.controller.js";
import { listInAppNotifications, markAllInAppNotificationsRead, markInAppNotificationRead, } from "../../modules/notifications/in-app.controller.js";
import { getOrgTenantDetail, getOrgTenantDocumentSignedUrl, getOrgTenantHistory, listOrgTenants, patchOrgTenant, patchOrgTenantDocumentReview, } from "../../modules/tenant-mgmt/tenant-owner.controller.js";
import { createTenantInvitation, listTenantInvitations, } from "../../modules/tenant-invitation/tenant-invitation-owner.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { inviteTenantDto } from "../../validations/invitation.dto.js";
import { updateOrganizationProfileDto } from "../../validations/organization.dto.js";
import { assignBedDto, bulkPropertySetupDto, createBedDto, createFloorDto, createRoomDto, markBedPaidDto, updateBedDto, updateFloorDto, updateRoomLayoutDto, } from "../../validations/property.dto.js";
import { ownerReviewDocumentDto, ownerUpdateTenantDto, } from "../../validations/tenant-mgmt.dto.js";
import { addMaintenanceMessageDto, bulkRemindRentDto, confirmRentPaymentDto, maintenanceTicketStatusBodyDto, patchMaintenanceTicketDto, updateRentReminderSettingsDto, } from "@pg-manager/shared";
import { bulkRemindRentHandler, confirmRentPaymentHandler, downloadRentReceiptPdfHandler, exportRentExcelHandler, generateRentMonthHandler, getRentDashboardHandler, getRentReminderSettings, listRentInvoicesHandler, listRentNotificationJobsHandler, patchRentReminderSettings, } from "../../modules/rent/rent-owner.controller.js";
import { getMaintenanceAttachmentSignedUrlHandler, getMaintenanceMetricsHandler, getMaintenanceTicketHandler, getMaintenanceTimelineHandler, listMaintenanceStaffHandler, listMaintenanceTicketsHandler, patchMaintenanceTicketHandler, postMaintenanceAttachmentHandler, postMaintenanceMessageHandler, postMaintenanceStatusHandler, } from "../../modules/maintenance/maintenance-owner.controller.js";
const maintenanceUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const inviteCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
});
export const ownerRouter = Router();
ownerRouter.use(requireAuth, requireRoles(UserRole.OWNER, UserRole.STAFF));
ownerRouter.get("/summary", asyncHandler(async (req, res) => {
    sendSuccess(res, {
        userId: req.auth.userId,
        role: req.auth.role,
    });
}));
ownerRouter.patch("/organizations/:orgId", requireOrgRoles(OrgRole.OWNER, OrgRole.MANAGER), validateBody(updateOrganizationProfileDto), updateOrganizationProfile);
ownerRouter.post("/organizations/:orgId/tenant-invitations", inviteCreateLimiter, requireOrgRoles(OrgRole.OWNER, OrgRole.MANAGER), validateBody(inviteTenantDto), createTenantInvitation);
ownerRouter.get("/organizations/:orgId/tenant-invitations", requireOrgRoles(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF), listTenantInvitations);
const propertyReadRoles = [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF];
const propertyStructureRoles = [OrgRole.OWNER, OrgRole.MANAGER];
const propertyBedOpsRoles = [
    OrgRole.OWNER,
    OrgRole.MANAGER,
    OrgRole.STAFF,
];
const tenantMgmtReadRoles = [
    OrgRole.OWNER,
    OrgRole.MANAGER,
    OrgRole.STAFF,
];
const tenantMgmtWriteRoles = [OrgRole.OWNER, OrgRole.MANAGER];
const rentReadRoles = [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF];
const rentWriteRoles = [OrgRole.OWNER, OrgRole.MANAGER];
const maintenanceReadRoles = [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF];
const maintenanceWriteRoles = [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF];
ownerRouter.get("/organizations/:orgId/property/map", requireOrgRoles(...propertyReadRoles), getPropertyMap);
ownerRouter.get("/organizations/:orgId/floor-map", requireOrgRoles(...propertyReadRoles), getFloorMap);
ownerRouter.get("/organizations/:orgId/floor-map/rooms/:roomId", requireOrgRoles(...propertyReadRoles), getRoomOperationalDetails);
ownerRouter.get("/organizations/:orgId/vacancy/summary", requireOrgRoles(...propertyReadRoles), getVacancySummary);
ownerRouter.get("/organizations/:orgId/vacancy/rooms", requireOrgRoles(...propertyReadRoles), getVacancyRooms);
ownerRouter.get("/organizations/:orgId/property/stats", requireOrgRoles(...propertyReadRoles), getPropertyStats);
ownerRouter.get("/organizations/:orgId/property/tenant-members", requireOrgRoles(...propertyReadRoles), listPropertyTenantMembers);
ownerRouter.post("/organizations/:orgId/property/quick-setup", requireOrgRoles(...propertyStructureRoles), validateBody(bulkPropertySetupDto), bulkPropertySetup);
ownerRouter.get("/organizations/:orgId/notifications", requireOrgRoles(...propertyReadRoles), listInAppNotifications);
ownerRouter.patch("/organizations/:orgId/notifications/:notificationId/read", requireOrgRoles(...propertyReadRoles), markInAppNotificationRead);
ownerRouter.post("/organizations/:orgId/notifications/read-all", requireOrgRoles(...propertyReadRoles), markAllInAppNotificationsRead);
ownerRouter.post("/organizations/:orgId/floors", requireOrgRoles(...propertyStructureRoles), validateBody(createFloorDto), createFloor);
ownerRouter.patch("/organizations/:orgId/floors/:floorId", requireOrgRoles(...propertyStructureRoles), validateBody(updateFloorDto), updateFloor);
ownerRouter.delete("/organizations/:orgId/floors/:floorId", requireOrgRoles(...propertyStructureRoles), deleteFloor);
ownerRouter.post("/organizations/:orgId/floors/:floorId/rooms", requireOrgRoles(...propertyStructureRoles), validateBody(createRoomDto), createRoom);
ownerRouter.patch("/organizations/:orgId/rooms/:roomId", requireOrgRoles(...propertyStructureRoles), validateBody(updateRoomLayoutDto), updateRoom);
ownerRouter.delete("/organizations/:orgId/rooms/:roomId", requireOrgRoles(...propertyStructureRoles), deleteRoom);
ownerRouter.post("/organizations/:orgId/rooms/:roomId/beds", requireOrgRoles(...propertyStructureRoles), validateBody(createBedDto), createBed);
ownerRouter.patch("/organizations/:orgId/beds/:bedId", requireOrgRoles(...propertyStructureRoles), validateBody(updateBedDto), updateBed);
ownerRouter.delete("/organizations/:orgId/beds/:bedId", requireOrgRoles(...propertyStructureRoles), deleteBed);
ownerRouter.post("/organizations/:orgId/beds/:bedId/assign", requireOrgRoles(...propertyBedOpsRoles), validateBody(assignBedDto), assignBed);
ownerRouter.post("/organizations/:orgId/beds/:bedId/vacate", requireOrgRoles(...propertyBedOpsRoles), vacateBed);
ownerRouter.post("/organizations/:orgId/beds/:bedId/mark-paid", requireOrgRoles(...propertyBedOpsRoles), validateBody(markBedPaidDto), markBedPaid);
ownerRouter.get("/organizations/:orgId/tenants", requireOrgRoles(...tenantMgmtReadRoles), listOrgTenants);
ownerRouter.get("/organizations/:orgId/tenants/:tenantId", requireOrgRoles(...tenantMgmtReadRoles), getOrgTenantDetail);
ownerRouter.patch("/organizations/:orgId/tenants/:tenantId", requireOrgRoles(...tenantMgmtWriteRoles), validateBody(ownerUpdateTenantDto), patchOrgTenant);
ownerRouter.get("/organizations/:orgId/tenants/:tenantId/history", requireOrgRoles(...tenantMgmtReadRoles), getOrgTenantHistory);
ownerRouter.get("/organizations/:orgId/tenants/documents/:documentId/signed-url", requireOrgRoles(...tenantMgmtReadRoles), getOrgTenantDocumentSignedUrl);
ownerRouter.patch("/organizations/:orgId/tenants/documents/:documentId/review", requireOrgRoles(...tenantMgmtWriteRoles), validateBody(ownerReviewDocumentDto), patchOrgTenantDocumentReview);
ownerRouter.get("/organizations/:orgId/rent/settings", requireOrgRoles(...rentReadRoles), getRentReminderSettings);
ownerRouter.patch("/organizations/:orgId/rent/settings", requireOrgRoles(...rentWriteRoles), validateBody(updateRentReminderSettingsDto), patchRentReminderSettings);
ownerRouter.get("/organizations/:orgId/rent/dashboard", requireOrgRoles(...rentReadRoles), getRentDashboardHandler);
ownerRouter.get("/organizations/:orgId/rent/invoices", requireOrgRoles(...rentReadRoles), listRentInvoicesHandler);
ownerRouter.post("/organizations/:orgId/rent/invoices/bulk-remind", requireOrgRoles(...rentWriteRoles), validateBody(bulkRemindRentDto), bulkRemindRentHandler);
ownerRouter.post("/organizations/:orgId/rent/invoices/:invoiceId/confirm-payment", requireOrgRoles(...rentWriteRoles), validateBody(confirmRentPaymentDto), confirmRentPaymentHandler);
ownerRouter.post("/organizations/:orgId/rent/actions/generate-month", requireOrgRoles(...rentWriteRoles), generateRentMonthHandler);
ownerRouter.get("/organizations/:orgId/rent/export.xlsx", requireOrgRoles(...rentReadRoles), exportRentExcelHandler);
ownerRouter.get("/organizations/:orgId/rent/invoices/:invoiceId/receipt.pdf", requireOrgRoles(...rentReadRoles), downloadRentReceiptPdfHandler);
ownerRouter.get("/organizations/:orgId/rent/notifications", requireOrgRoles(...rentReadRoles), listRentNotificationJobsHandler);
ownerRouter.get("/organizations/:orgId/maintenance/staff", requireOrgRoles(...maintenanceReadRoles), listMaintenanceStaffHandler);
ownerRouter.get("/organizations/:orgId/maintenance/metrics", requireOrgRoles(...maintenanceReadRoles), getMaintenanceMetricsHandler);
ownerRouter.get("/organizations/:orgId/maintenance/tickets", requireOrgRoles(...maintenanceReadRoles), listMaintenanceTicketsHandler);
ownerRouter.get("/organizations/:orgId/maintenance/tickets/:ticketId", requireOrgRoles(...maintenanceReadRoles), getMaintenanceTicketHandler);
ownerRouter.get("/organizations/:orgId/maintenance/tickets/:ticketId/timeline", requireOrgRoles(...maintenanceReadRoles), getMaintenanceTimelineHandler);
ownerRouter.patch("/organizations/:orgId/maintenance/tickets/:ticketId", requireOrgRoles(...maintenanceWriteRoles), validateBody(patchMaintenanceTicketDto), patchMaintenanceTicketHandler);
ownerRouter.post("/organizations/:orgId/maintenance/tickets/:ticketId/status", requireOrgRoles(...maintenanceWriteRoles), validateBody(maintenanceTicketStatusBodyDto), postMaintenanceStatusHandler);
ownerRouter.post("/organizations/:orgId/maintenance/tickets/:ticketId/messages", requireOrgRoles(...maintenanceWriteRoles), validateBody(addMaintenanceMessageDto), postMaintenanceMessageHandler);
ownerRouter.post("/organizations/:orgId/maintenance/tickets/:ticketId/attachments", requireOrgRoles(...maintenanceWriteRoles), maintenanceUpload.single("file"), postMaintenanceAttachmentHandler);
ownerRouter.get("/organizations/:orgId/maintenance/tickets/:ticketId/attachments/:attachmentId/signed-url", requireOrgRoles(...maintenanceReadRoles), getMaintenanceAttachmentSignedUrlHandler);
//# sourceMappingURL=owner.routes.js.map