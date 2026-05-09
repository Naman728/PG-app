import type { Request, Response } from "express";
import {
  addMaintenanceMessageDto,
  createMaintenanceTicketDto,
  submitMaintenanceRatingDto,
} from "@pg-manager/shared";
import { MaintenanceMessageVisibility } from "@prisma/client";
import { sendSuccess } from "../../common/apiResponse.js";
import { badRequest } from "../../common/httpErrors.js";
import { resolveTenantOrganizationId } from "../../common/resolveTenantOrg.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addMaintenanceAttachment,
  addMaintenanceMessage,
  createMaintenanceTicket,
  getMaintenanceAttachmentSignedUrl,
  getMaintenanceTicketForTenant,
  getMaintenanceTimeline,
  listMyMaintenanceTickets,
  submitMaintenanceRating,
} from "./maintenance.service.js";

export const postMyMaintenanceTicket = asyncHandler(async (req: Request, res: Response) => {
  const body = createMaintenanceTicketDto.parse(req.body);
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const created = await createMaintenanceTicket({
    organizationId,
    tenantUserId: req.auth!.userId,
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    bedId: body.bedId,
  });
  sendSuccess(res, created);
});

export const listMyMaintenanceTicketsHandler = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 25)));
  const result = await listMyMaintenanceTickets({
    organizationId,
    tenantUserId: req.auth!.userId,
    page,
    pageSize,
  });
  sendSuccess(res, result);
});

export const getMyMaintenanceTicket = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const ticket = await getMaintenanceTicketForTenant(
    organizationId,
    req.params.ticketId,
    req.auth!.userId,
  );
  sendSuccess(res, { ticket });
});

export const getMyMaintenanceTimeline = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const timeline = await getMaintenanceTimeline({
    ticketId: req.params.ticketId,
    organizationId,
    viewerUserId: req.auth!.userId,
    viewerIsStaff: false,
  });
  sendSuccess(res, timeline);
});

export const postMyMaintenanceMessage = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const body = addMaintenanceMessageDto.parse(req.body);
  const msg = await addMaintenanceMessage({
    organizationId,
    ticketId: req.params.ticketId,
    authorUserId: req.auth!.userId,
    body: body.body,
    visibility: MaintenanceMessageVisibility.TENANT,
    authorIsStaff: false,
  });
  sendSuccess(res, msg);
});

export const postMyMaintenanceAttachment = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file?.buffer) throw badRequest("Missing file upload (field name: file)");
  const result = await addMaintenanceAttachment({
    organizationId,
    ticketId: req.params.ticketId,
    uploaderUserId: req.auth!.userId,
    buffer: file.buffer,
    mimeType: file.mimetype,
    originalFilename: file.originalname,
    uploaderIsStaff: false,
  });
  sendSuccess(res, result);
});

export const postMyMaintenanceRating = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
  const body = submitMaintenanceRatingDto.parse(req.body);
  await submitMaintenanceRating({
    organizationId,
    ticketId: req.params.ticketId,
    tenantUserId: req.auth!.userId,
    rating: body.rating,
    feedback: body.feedback,
  });
  sendSuccess(res, { ok: true });
});

export const getMyMaintenanceAttachmentSignedUrl = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = await resolveTenantOrganizationId(req.auth!.userId);
    const url = await getMaintenanceAttachmentSignedUrl({
      organizationId,
      ticketId: req.params.ticketId,
      attachmentId: req.params.attachmentId,
      requesterUserId: req.auth!.userId,
      requesterIsStaff: false,
    });
    sendSuccess(res, url);
  },
);
