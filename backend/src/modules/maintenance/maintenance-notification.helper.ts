import { OrgRole } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { enqueueNotificationJob } from "../rent/notification-queue.service.js";
import {
  MAINTENANCE_NOTIFICATION_TYPES,
  type MaintenanceStaffAlertPayload,
  type MaintenanceTenantAlertPayload,
} from "./maintenance.constants.js";

export async function notifyManagersNewTicket(params: {
  organizationId: string;
  ticketId: string;
  title: string;
}): Promise<void> {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: params.organizationId,
      orgRole: { in: [OrgRole.OWNER, OrgRole.MANAGER] },
    },
    select: { userId: true },
  });
  for (const m of members) {
    const payload: MaintenanceStaffAlertPayload = {
      recipientUserId: m.userId,
      ticketId: params.ticketId,
      headline: "New maintenance ticket",
      detail: params.title,
    };
    await enqueueNotificationJob({
      organizationId: params.organizationId,
      type: MAINTENANCE_NOTIFICATION_TYPES.STAFF_ALERT,
      payload,
    });
  }
}

export async function notifyAssignee(params: {
  organizationId: string;
  assigneeUserId: string;
  ticketId: string;
  title: string;
}): Promise<void> {
  const payload: MaintenanceStaffAlertPayload = {
    recipientUserId: params.assigneeUserId,
    ticketId: params.ticketId,
    headline: "You were assigned a ticket",
    detail: params.title,
  };
  await enqueueNotificationJob({
    organizationId: params.organizationId,
    type: MAINTENANCE_NOTIFICATION_TYPES.STAFF_ALERT,
    payload,
  });
}

export async function notifyTenantTicketResolved(params: {
  organizationId: string;
  tenantUserId: string;
  ticketId: string;
  title: string;
}): Promise<void> {
  const payload: MaintenanceTenantAlertPayload = {
    recipientUserId: params.tenantUserId,
    ticketId: params.ticketId,
    headline: "Maintenance resolved — please rate",
    detail: params.title,
  };
  await enqueueNotificationJob({
    organizationId: params.organizationId,
    type: MAINTENANCE_NOTIFICATION_TYPES.TENANT_ALERT,
    payload,
  });
}
