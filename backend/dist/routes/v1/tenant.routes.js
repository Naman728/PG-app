import { Router } from "express";
import multer from "multer";
import { UserRole } from "@prisma/client";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRoles } from "../../middleware/roles.middleware.js";
import { validateBody } from "../../middleware/validateDto.js";
import { deleteMyDocument, deleteMyEmergencyContact, getMyDocumentSignedUrl, getMyEmergencyContacts, getMyTenantHistory, getMyTenantProfile, patchMyEmergencyContact, patchMyTenantProfile, postMyDocument, postMyEmergencyContact, postMyKycSubmit, } from "../../modules/tenant-mgmt/tenant-portal.controller.js";
import { createEmergencyContactDto, updateEmergencyContactDto, updateTenantProfileDto, } from "../../validations/tenant-mgmt.dto.js";
import { addMaintenanceMessageDto, createMaintenanceTicketDto, submitMaintenanceRatingDto, } from "@pg-manager/shared";
import { getMyMaintenanceAttachmentSignedUrl, getMyMaintenanceTicket, getMyMaintenanceTimeline, listMyMaintenanceTicketsHandler, postMyMaintenanceAttachment, postMyMaintenanceMessage, postMyMaintenanceRating, postMyMaintenanceTicket, } from "../../modules/maintenance/maintenance-tenant.controller.js";
import { listMyRentInvoices } from "../../modules/rent/rent-tenant.controller.js";
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
export const tenantRouter = Router();
tenantRouter.use(requireAuth, requireRoles(UserRole.TENANT));
tenantRouter.get("/me/profile", getMyTenantProfile);
tenantRouter.patch("/me/profile", validateBody(updateTenantProfileDto), patchMyTenantProfile);
tenantRouter.post("/me/kyc/submit", postMyKycSubmit);
tenantRouter.post("/me/documents", upload.single("file"), postMyDocument);
tenantRouter.delete("/me/documents/:documentId", deleteMyDocument);
tenantRouter.get("/me/documents/:documentId/signed-url", getMyDocumentSignedUrl);
tenantRouter.get("/me/emergency-contacts", getMyEmergencyContacts);
tenantRouter.post("/me/emergency-contacts", validateBody(createEmergencyContactDto), postMyEmergencyContact);
tenantRouter.patch("/me/emergency-contacts/:contactId", validateBody(updateEmergencyContactDto), patchMyEmergencyContact);
tenantRouter.delete("/me/emergency-contacts/:contactId", deleteMyEmergencyContact);
tenantRouter.get("/me/history", getMyTenantHistory);
tenantRouter.get("/me/rent/invoices", listMyRentInvoices);
tenantRouter.get("/me/maintenance/tickets", listMyMaintenanceTicketsHandler);
tenantRouter.post("/me/maintenance/tickets", validateBody(createMaintenanceTicketDto), postMyMaintenanceTicket);
tenantRouter.get("/me/maintenance/tickets/:ticketId", getMyMaintenanceTicket);
tenantRouter.get("/me/maintenance/tickets/:ticketId/timeline", getMyMaintenanceTimeline);
tenantRouter.post("/me/maintenance/tickets/:ticketId/messages", validateBody(addMaintenanceMessageDto), postMyMaintenanceMessage);
tenantRouter.post("/me/maintenance/tickets/:ticketId/attachments", upload.single("file"), postMyMaintenanceAttachment);
tenantRouter.post("/me/maintenance/tickets/:ticketId/rate", validateBody(submitMaintenanceRatingDto), postMyMaintenanceRating);
tenantRouter.get("/me/maintenance/tickets/:ticketId/attachments/:attachmentId/signed-url", getMyMaintenanceAttachmentSignedUrl);
//# sourceMappingURL=tenant.routes.js.map