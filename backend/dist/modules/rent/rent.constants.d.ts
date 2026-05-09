export declare const NOTIFICATION_JOB_TYPES: {
    readonly RENT_TENANT_REMINDER: "RENT_TENANT_REMINDER";
    readonly RENT_OWNER_OVERDUE_DIGEST: "RENT_OWNER_OVERDUE_DIGEST";
};
export type RentReminderKind = "UPCOMING" | "OVERDUE" | "MANUAL";
export type RentTenantReminderPayload = {
    invoiceId: string;
    kind: RentReminderKind;
};
export type RentOwnerDigestPayload = {
    recipientUserId: string;
    overdueCount: number;
};
