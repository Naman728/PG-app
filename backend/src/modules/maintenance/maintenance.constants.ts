export const MAINTENANCE_NOTIFICATION_TYPES = {
  STAFF_ALERT: "MAINTENANCE_STAFF_ALERT",
  TENANT_ALERT: "MAINTENANCE_TENANT_ALERT",
} as const;

export type MaintenanceStaffAlertPayload = {
  recipientUserId: string;
  ticketId: string;
  headline: string;
  detail: string;
};

export type MaintenanceTenantAlertPayload = {
  recipientUserId: string;
  ticketId: string;
  headline: string;
  detail: string;
};

export const MAINTENANCE_ACTIVITY = {
  TICKET_CREATED: "TICKET_CREATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ASSIGNED: "ASSIGNED",
  PHOTO_ADDED: "PHOTO_ADDED",
  COST_UPDATED: "COST_UPDATED",
  RESOLVED: "RESOLVED",
  REOPENED: "REOPENED",
  RATING_SUBMITTED: "RATING_SUBMITTED",
} as const;
