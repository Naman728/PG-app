import type { Request, Response } from "express";
import {
  addMaintenanceMessageDto,
  listMaintenanceTicketsQueryDto,
  maintenanceMetricsQueryDto,
  maintenanceTicketStatusBodyDto,
  patchMaintenanceTicketDto,
} from "@pg-manager/shared";
import { MaintenanceMessageVisibility } from "@prisma/client";
import { sendSuccess } from "../../common/apiResponse.js";
import { badRequest, notFound } from "../../common/httpErrors.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addMaintenanceAttachment,
  addMaintenanceMessage,
  getMaintenanceAttachmentSignedUrl,
  getMaintenanceMetrics,
  getMaintenanceTicketForOrg,
  getMaintenanceTimeline,
  listMaintenanceStaffAssignees,
  listMaintenanceTicketsForOrg,
  patchMaintenanceTicketMeta,
  patchMaintenanceTicketStaff,
  patchMaintenanceTicketStatus,
} from "./maintenance.service.js";

export const listMaintenanceStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const staff = await listMaintenanceStaffAssignees(orgId);
  sendSuccess(res, { staff });
});

export const listMaintenanceTicketsHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const parsed = listMaintenanceTicketsQueryDto.parse({
    page: req.query.page,
    pageSize: req.query.pageSize,
    status: req.query.status,
    category: req.query.category,
    priority: req.query.priority,
    assignedToUserId: req.query.assignedToUserId,
    q: req.query.q,
  });
  const result = await listMaintenanceTicketsForOrg({ organizationId: orgId, query: parsed });
  sendSuccess(res, result);
});

export const getMaintenanceTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const ticket = await getMaintenanceTicketForOrg(orgId, req.params.ticketId);
  if (!ticket) throw notFound("Ticket not found");
  sendSuccess(res, { ticket });
});

export const getMaintenanceTimelineHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const timeline = await getMaintenanceTimeline({
    ticketId: req.params.ticketId,
    organizationId: orgId,
    viewerUserId: req.auth!.userId,
    viewerIsStaff: true,
  });
  sendSuccess(res, timeline);
});

export const patchMaintenanceTicketHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const body = patchMaintenanceTicketDto.parse(req.body);
  if (body.assignedToUserId !== undefined) {
    await patchMaintenanceTicketStaff({
      organizationId: orgId,
      ticketId: req.params.ticketId,
      actorUserId: req.auth!.userId,
      assignedToUserId: body.assignedToUserId,
    });
  }
  if (body.priority !== undefined || body.resolutionCostMinor !== undefined) {
    await patchMaintenanceTicketMeta({
      organizationId: orgId,
      ticketId: req.params.ticketId,
      actorUserId: req.auth!.userId,
      priority: body.priority,
      resolutionCostMinor: body.resolutionCostMinor,
    });
  }
  const ticket = await getMaintenanceTicketForOrg(orgId, req.params.ticketId);
  sendSuccess(res, { ticket });
});

export const postMaintenanceStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const body = maintenanceTicketStatusBodyDto.parse(req.body);
  await patchMaintenanceTicketStatus({
    organizationId: orgId,
    ticketId: req.params.ticketId,
    actorUserId: req.auth!.userId,
    status: body.status,
    resolutionSummary: body.resolutionSummary,
  });
  const ticket = await getMaintenanceTicketForOrg(orgId, req.params.ticketId);
  sendSuccess(res, { ticket });
});

export const postMaintenanceMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const body = addMaintenanceMessageDto.parse(req.body);
  const msg = await addMaintenanceMessage({
    organizationId: orgId,
    ticketId: req.params.ticketId,
    authorUserId: req.auth!.userId,
    body: body.body,
    visibility: body.visibility as MaintenanceMessageVisibility,
    authorIsStaff: true,
  });
  sendSuccess(res, msg);
});

export const postMaintenanceAttachmentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file?.buffer) throw badRequest("Missing file upload (field name: file)");
    const result = await addMaintenanceAttachment({
      organizationId: orgId,
      ticketId: req.params.ticketId,
      uploaderUserId: req.auth!.userId,
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
      uploaderIsStaff: true,
    });
    sendSuccess(res, result);
  },
);

export const getMaintenanceAttachmentSignedUrlHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.params.orgId;
    const url = await getMaintenanceAttachmentSignedUrl({
      organizationId: orgId,
      ticketId: req.params.ticketId,
      attachmentId: req.params.attachmentId,
      requesterUserId: req.auth!.userId,
      requesterIsStaff: true,
    });
    sendSuccess(res, url);
  },
);

export const getMaintenanceMetricsHandler = asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.params.orgId;
  const q = maintenanceMetricsQueryDto.parse({
    from: req.query.from,
    to: req.query.to,
  });
  const metrics = await getMaintenanceMetrics({
    organizationId: orgId,
    from: new Date(q.from),
    to: new Date(q.to),
  });
  sendSuccess(res, metrics);
});
