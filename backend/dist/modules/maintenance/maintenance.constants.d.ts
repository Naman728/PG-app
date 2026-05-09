export declare const MAINTENANCE_NOTIFICATION_TYPES: {
    readonly STAFF_ALERT: "MAINTENANCE_STAFF_ALERT";
    readonly TENANT_ALERT: "MAINTENANCE_TENANT_ALERT";
};
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
export declare const MAINTENANCE_ACTIVITY: {
    readonly TICKET_CREATED: "TICKET_CREATED";
    readonly STATUS_CHANGED: "STATUS_CHANGED";
    readonly ASSIGNED: "ASSIGNED";
    readonly PHOTO_ADDED: "PHOTO_ADDED";
    readonly COST_UPDATED: "COST_UPDATED";
    readonly RESOLVED: "RESOLVED";
    readonly REOPENED: "REOPENED";
    readonly RATING_SUBMITTED: "RATING_SUBMITTED";
};
