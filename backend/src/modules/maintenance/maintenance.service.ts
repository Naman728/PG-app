import type { Prisma } from "@prisma/client";
import {
  MaintenanceMessageVisibility,
  MaintenanceTicketCategory,
  MaintenanceTicketPriority,
  MaintenanceTicketStatus,
  OrgRole,
} from "@prisma/client";
import { badRequest, forbidden, notFound } from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";
import {
  signedAuthenticatedUrl,
  uploadMaintenanceTicketPhoto,
} from "../../services/cloudinary.service.js";
import { MAINTENANCE_ACTIVITY } from "./maintenance.constants.js";
import {
  notifyAssignee,
  notifyManagersNewTicket,
  notifyTenantTicketResolved,
} from "./maintenance-notification.helper.js";

const STATUS_FLOW: Record<MaintenanceTicketStatus, MaintenanceTicketStatus[]> = {
  OPEN: [
    MaintenanceTicketStatus.ACKNOWLEDGED,
    MaintenanceTicketStatus.IN_PROGRESS,
    MaintenanceTicketStatus.CLOSED,
  ],
  ACKNOWLEDGED: [
    MaintenanceTicketStatus.IN_PROGRESS,
    MaintenanceTicketStatus.BLOCKED,
    MaintenanceTicketStatus.OPEN,
  ],
  IN_PROGRESS: [
    MaintenanceTicketStatus.BLOCKED,
    MaintenanceTicketStatus.RESOLVED,
    MaintenanceTicketStatus.ACKNOWLEDGED,
  ],
  BLOCKED: [MaintenanceTicketStatus.IN_PROGRESS, MaintenanceTicketStatus.ACKNOWLEDGED],
  RESOLVED: [MaintenanceTicketStatus.CLOSED, MaintenanceTicketStatus.IN_PROGRESS],
  CLOSED: [],
};

function assertTransition(from: MaintenanceTicketStatus, to: MaintenanceTicketStatus): void {
  if (from === to) return;
  const allowed = STATUS_FLOW[from];
  if (!allowed.includes(to)) {
    throw badRequest(`Cannot change status from ${from} to ${to}`);
  }
}

async function appendActivity(params: {
  ticketId: string;
  actorUserId: string | null;
  activityType: string;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.maintenanceTicketActivity.create({
    data: {
      ticketId: params.ticketId,
      actorUserId: params.actorUserId,
      activityType: params.activityType,
      payload: params.payload,
    },
  });
}

export async function assertTenantInOrg(organizationId: string, userId: string): Promise<void> {
  const m = await prisma.organizationMember.findFirst({
    where: { organizationId, userId, orgRole: OrgRole.TENANT },
  });
  if (!m) throw forbidden("Not a tenant of this organization");
}

export async function assertStaffInOrg(organizationId: string, userId: string): Promise<void> {
  const m = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      orgRole: { in: [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF] },
    },
  });
  if (!m) throw forbidden("No staff access for this organization");
}

async function assertBedInOrg(organizationId: string, bedId: string): Promise<void> {
  const bed = await prisma.bed.findFirst({
    where: {
      id: bedId,
      deletedAt: null,
      room: { deletedAt: null, floor: { organizationId, deletedAt: null } },
    },
  });
  if (!bed) throw badRequest("Bed not found in this organization");
}

export async function createMaintenanceTicket(params: {
  organizationId: string;
  tenantUserId: string;
  title: string;
  description: string;
  category: MaintenanceTicketCategory;
  priority: MaintenanceTicketPriority;
  bedId?: string | null;
}): Promise<{ id: string }> {
  await assertTenantInOrg(params.organizationId, params.tenantUserId);
  if (params.bedId) {
    await assertBedInOrg(params.organizationId, params.bedId);
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      organizationId: params.organizationId,
      tenantUserId: params.tenantUserId,
      bedId: params.bedId ?? undefined,
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category,
      priority: params.priority,
      status: MaintenanceTicketStatus.OPEN,
    },
  });

  await appendActivity({
    ticketId: ticket.id,
    actorUserId: params.tenantUserId,
    activityType: MAINTENANCE_ACTIVITY.TICKET_CREATED,
    payload: { title: ticket.title, category: ticket.category },
  });

  await notifyManagersNewTicket({
    organizationId: params.organizationId,
    ticketId: ticket.id,
    title: ticket.title,
  });

  return { id: ticket.id };
}

export async function listMaintenanceTicketsForOrg(params: {
  organizationId: string;
  query: {
    page: number;
    pageSize: number;
    status?: MaintenanceTicketStatus;
    category?: MaintenanceTicketCategory;
    priority?: MaintenanceTicketPriority;
    assignedToUserId?: string;
    q?: string;
  };
}) {
  const where: Prisma.MaintenanceTicketWhereInput = {
    organizationId: params.organizationId,
    deletedAt: null,
  };
  if (params.query.status) where.status = params.query.status;
  if (params.query.category) where.category = params.query.category;
  if (params.query.priority) where.priority = params.query.priority;
  if (params.query.assignedToUserId) where.assignedToUserId = params.query.assignedToUserId;
  if (params.query.q?.trim()) {
    where.title = { contains: params.query.q.trim(), mode: "insensitive" };
  }

  const skip = (params.query.page - 1) * params.query.pageSize;
  const [items, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      skip,
      take: params.query.pageSize,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        assignee: { select: { id: true, name: true, phone: true } },
        bed: {
          select: {
            id: true,
            label: true,
            room: { select: { name: true, floor: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);
  return { items, total, page: params.query.page, pageSize: params.query.pageSize };
}

export async function listMyMaintenanceTickets(params: {
  organizationId: string;
  tenantUserId: string;
  page: number;
  pageSize: number;
}) {
  await assertTenantInOrg(params.organizationId, params.tenantUserId);
  const skip = (params.page - 1) * params.pageSize;
  const where: Prisma.MaintenanceTicketWhereInput = {
    organizationId: params.organizationId,
    tenantUserId: params.tenantUserId,
    deletedAt: null,
  };
  const [items, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      skip,
      take: params.pageSize,
      orderBy: { updatedAt: "desc" },
      include: {
        assignee: { select: { id: true, name: true } },
        bed: {
          select: {
            label: true,
            room: { select: { name: true, floor: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getMaintenanceTicketForOrg(organizationId: string, ticketId: string) {
  return prisma.maintenanceTicket.findFirst({
    where: { id: ticketId, organizationId, deletedAt: null },
    include: {
      tenant: { select: { id: true, name: true, phone: true } },
      assignee: { select: { id: true, name: true, phone: true } },
      bed: {
        select: {
          id: true,
          label: true,
          room: { select: { name: true, floor: { select: { name: true } } } },
        },
      },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getMaintenanceTicketForTenant(
  organizationId: string,
  ticketId: string,
  tenantUserId: string,
) {
  const t = await prisma.maintenanceTicket.findFirst({
    where: {
      id: ticketId,
      organizationId,
      tenantUserId,
      deletedAt: null,
    },
    include: {
      assignee: { select: { id: true, name: true } },
      bed: {
        select: {
          label: true,
          room: { select: { name: true, floor: { select: { name: true } } } },
        },
      },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!t) throw notFound("Ticket not found");
  return t;
}

export async function getMaintenanceTimeline(params: {
  ticketId: string;
  organizationId: string;
  viewerUserId: string;
  viewerIsStaff: boolean;
}) {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
    select: { tenantUserId: true },
  });
  if (!ticket) throw notFound("Ticket not found");

  if (!params.viewerIsStaff && ticket.tenantUserId !== params.viewerUserId) {
    throw forbidden("Cannot view this ticket");
  }

  const [activities, messages] = await Promise.all([
    prisma.maintenanceTicketActivity.findMany({
      where: { ticketId: params.ticketId },
      orderBy: { createdAt: "asc" },
      include: { actor: { select: { id: true, name: true } } },
    }),
    prisma.maintenanceTicketMessage.findMany({
      where: {
        ticketId: params.ticketId,
        ...(params.viewerIsStaff
          ? {}
          : { visibility: MaintenanceMessageVisibility.TENANT }),
      },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true } } },
    }),
  ]);

  type Entry =
    | { kind: "activity"; createdAt: Date; data: (typeof activities)[0] }
    | { kind: "message"; createdAt: Date; data: (typeof messages)[0] };

  const merged: Entry[] = [
    ...activities.map((a) => ({ kind: "activity" as const, createdAt: a.createdAt, data: a })),
    ...messages.map((m) => ({ kind: "message" as const, createdAt: m.createdAt, data: m })),
  ];
  merged.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return { entries: merged };
}

export async function patchMaintenanceTicketStaff(params: {
  organizationId: string;
  ticketId: string;
  actorUserId: string;
  assignedToUserId: string | null;
}): Promise<void> {
  await assertStaffInOrg(params.organizationId, params.actorUserId);
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
  });
  if (!ticket) throw notFound("Ticket not found");

  if (params.assignedToUserId) {
    await assertStaffInOrg(params.organizationId, params.assignedToUserId);
  }

  const prev = ticket.assignedToUserId;
  await prisma.maintenanceTicket.update({
    where: { id: ticket.id },
    data: { assignedToUserId: params.assignedToUserId },
  });

  await appendActivity({
    ticketId: ticket.id,
    actorUserId: params.actorUserId,
    activityType: MAINTENANCE_ACTIVITY.ASSIGNED,
    payload: { from: prev, to: params.assignedToUserId },
  });

  if (params.assignedToUserId && params.assignedToUserId !== prev) {
    await notifyAssignee({
      organizationId: params.organizationId,
      assigneeUserId: params.assignedToUserId,
      ticketId: ticket.id,
      title: ticket.title,
    });
  }
}

export async function patchMaintenanceTicketStatus(params: {
  organizationId: string;
  ticketId: string;
  actorUserId: string;
  status: MaintenanceTicketStatus;
  resolutionSummary?: string | null;
}): Promise<void> {
  await assertStaffInOrg(params.organizationId, params.actorUserId);
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
  });
  if (!ticket) throw notFound("Ticket not found");

  assertTransition(ticket.status, params.status);

  const reopening =
    params.status === MaintenanceTicketStatus.IN_PROGRESS &&
    ticket.status === MaintenanceTicketStatus.RESOLVED;

  const data: Prisma.MaintenanceTicketUpdateInput = { status: params.status };
  if (params.status === MaintenanceTicketStatus.RESOLVED) {
    data.resolvedAt = new Date();
    if (params.resolutionSummary != null) {
      data.resolutionSummary = params.resolutionSummary;
    }
  }
  if (reopening) {
    data.resolvedAt = null;
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticket.id },
    data,
  });

  if (params.status === MaintenanceTicketStatus.RESOLVED) {
    await appendActivity({
      ticketId: ticket.id,
      actorUserId: params.actorUserId,
      activityType: MAINTENANCE_ACTIVITY.RESOLVED,
      payload: { from: ticket.status, summary: params.resolutionSummary ?? null },
    });
    await notifyTenantTicketResolved({
      organizationId: params.organizationId,
      tenantUserId: ticket.tenantUserId,
      ticketId: ticket.id,
      title: ticket.title,
    });
  } else if (reopening) {
    await appendActivity({
      ticketId: ticket.id,
      actorUserId: params.actorUserId,
      activityType: MAINTENANCE_ACTIVITY.REOPENED,
      payload: { from: ticket.status, to: params.status },
    });
  } else {
    await appendActivity({
      ticketId: ticket.id,
      actorUserId: params.actorUserId,
      activityType: MAINTENANCE_ACTIVITY.STATUS_CHANGED,
      payload: { from: ticket.status, to: params.status },
    });
  }
}

export async function patchMaintenanceTicketMeta(params: {
  organizationId: string;
  ticketId: string;
  actorUserId: string;
  priority?: MaintenanceTicketPriority;
  resolutionCostMinor?: number | null;
}): Promise<void> {
  await assertStaffInOrg(params.organizationId, params.actorUserId);
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
  });
  if (!ticket) throw notFound("Ticket not found");

  const data: Prisma.MaintenanceTicketUpdateInput = {};
  if (params.priority != null) data.priority = params.priority;
  if (params.resolutionCostMinor !== undefined) {
    data.resolutionCostMinor = params.resolutionCostMinor;
    await appendActivity({
      ticketId: ticket.id,
      actorUserId: params.actorUserId,
      activityType: MAINTENANCE_ACTIVITY.COST_UPDATED,
      payload: { resolutionCostMinor: params.resolutionCostMinor },
    });
  }

  if (Object.keys(data).length === 0) return;
  await prisma.maintenanceTicket.update({ where: { id: ticket.id }, data });
}

export async function addMaintenanceMessage(params: {
  organizationId: string;
  ticketId: string;
  authorUserId: string;
  body: string;
  visibility: MaintenanceMessageVisibility;
  authorIsStaff: boolean;
}): Promise<{ id: string }> {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
  });
  if (!ticket) throw notFound("Ticket not found");

  let visibility = params.visibility;
  if (!params.authorIsStaff) {
    if (ticket.tenantUserId !== params.authorUserId) throw forbidden("Cannot comment on this ticket");
    visibility = MaintenanceMessageVisibility.TENANT;
  } else {
    await assertStaffInOrg(params.organizationId, params.authorUserId);
  }

  const msg = await prisma.maintenanceTicketMessage.create({
    data: {
      ticketId: ticket.id,
      authorUserId: params.authorUserId,
      body: params.body.trim(),
      visibility,
    },
  });
  return { id: msg.id };
}

export async function submitMaintenanceRating(params: {
  organizationId: string;
  ticketId: string;
  tenantUserId: string;
  rating: number;
  feedback?: string | null;
}): Promise<void> {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: {
      id: params.ticketId,
      organizationId: params.organizationId,
      tenantUserId: params.tenantUserId,
      deletedAt: null,
    },
  });
  if (!ticket) throw notFound("Ticket not found");
  if (
    ticket.status !== MaintenanceTicketStatus.RESOLVED &&
    ticket.status !== MaintenanceTicketStatus.CLOSED
  ) {
    throw badRequest("You can only rate resolved tickets");
  }
  if (ticket.resolutionRating != null) {
    throw badRequest("Rating already submitted");
  }
  if (params.rating < 1 || params.rating > 5) {
    throw badRequest("Rating must be between 1 and 5");
  }

  await prisma.maintenanceTicket.update({
    where: { id: ticket.id },
    data: {
      resolutionRating: params.rating,
      resolutionFeedback: params.feedback?.trim() || null,
      ratedAt: new Date(),
    },
  });

  await appendActivity({
    ticketId: ticket.id,
    actorUserId: params.tenantUserId,
    activityType: MAINTENANCE_ACTIVITY.RATING_SUBMITTED,
    payload: { rating: params.rating },
  });
}

export async function addMaintenanceAttachment(params: {
  organizationId: string;
  ticketId: string;
  uploaderUserId: string;
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  uploaderIsStaff: boolean;
}): Promise<{ id: string; publicId: string }> {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
  });
  if (!ticket) throw notFound("Ticket not found");

  if (params.uploaderIsStaff) {
    await assertStaffInOrg(params.organizationId, params.uploaderUserId);
  } else if (ticket.tenantUserId !== params.uploaderUserId) {
    throw forbidden("Cannot upload to this ticket");
  } else {
    await assertTenantInOrg(params.organizationId, params.uploaderUserId);
  }

  const uploaded = await uploadMaintenanceTicketPhoto({
    organizationId: params.organizationId,
    ticketId: params.ticketId,
    buffer: params.buffer,
    mimeType: params.mimeType,
    originalFilename: params.originalFilename,
  });

  const row = await prisma.maintenanceTicketAttachment.create({
    data: {
      ticketId: params.ticketId,
      cloudinaryPublicId: uploaded.publicId,
      mimeType: params.mimeType,
      byteSize: uploaded.bytes,
      originalFilename: params.originalFilename,
      uploadedByUserId: params.uploaderUserId,
    },
  });

  await appendActivity({
    ticketId: params.ticketId,
    actorUserId: params.uploaderUserId,
    activityType: MAINTENANCE_ACTIVITY.PHOTO_ADDED,
    payload: { attachmentId: row.id },
  });

  return { id: row.id, publicId: uploaded.publicId };
}

export async function listMaintenanceStaffAssignees(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      orgRole: { in: [OrgRole.OWNER, OrgRole.MANAGER, OrgRole.STAFF] },
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return members.map((m) => ({
    userId: m.userId,
    orgRole: m.orgRole,
    user: m.user,
  }));
}

export async function getMaintenanceAttachmentSignedUrl(params: {
  organizationId: string;
  ticketId: string;
  attachmentId: string;
  requesterUserId: string;
  requesterIsStaff: boolean;
}): Promise<{ url: string }> {
  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id: params.ticketId, organizationId: params.organizationId, deletedAt: null },
    select: { tenantUserId: true },
  });
  if (!ticket) throw notFound("Ticket not found");
  if (!params.requesterIsStaff && ticket.tenantUserId !== params.requesterUserId) {
    throw forbidden("Cannot access this attachment");
  }
  if (params.requesterIsStaff) {
    await assertStaffInOrg(params.organizationId, params.requesterUserId);
  }

  const att = await prisma.maintenanceTicketAttachment.findFirst({
    where: { id: params.attachmentId, ticketId: params.ticketId },
  });
  if (!att) throw notFound("Attachment not found");

  return { url: signedAuthenticatedUrl(att.cloudinaryPublicId, "image") };
}

export async function getMaintenanceMetrics(params: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  const resolved = await prisma.maintenanceTicket.findMany({
    where: {
      organizationId: params.organizationId,
      deletedAt: null,
      status: { in: [MaintenanceTicketStatus.RESOLVED, MaintenanceTicketStatus.CLOSED] },
      resolvedAt: { gte: params.from, lte: params.to },
    },
    select: {
      id: true,
      createdAt: true,
      resolvedAt: true,
      resolutionCostMinor: true,
      resolutionRating: true,
      category: true,
    },
  });

  let totalResolutionMs = 0;
  let resolutionCount = 0;
  let costSum = 0;
  let costCount = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  const byCategory: Record<string, number> = {};

  for (const r of resolved) {
    if (r.resolvedAt) {
      totalResolutionMs += r.resolvedAt.getTime() - r.createdAt.getTime();
      resolutionCount += 1;
    }
    if (r.resolutionCostMinor != null && r.resolutionCostMinor > 0) {
      costSum += r.resolutionCostMinor;
      costCount += 1;
    }
    if (r.resolutionRating != null) {
      ratingSum += r.resolutionRating;
      ratingCount += 1;
    }
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  return {
    resolvedCount: resolved.length,
    avgResolutionHours:
      resolutionCount > 0 ? totalResolutionMs / resolutionCount / 3_600_000 : null,
    avgCostMinor: costCount > 0 ? costSum / costCount : null,
    avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    byCategory,
  };
}
