import type { Prisma, RentInvoice, RentReminderSettings } from "@prisma/client";
import { RentInvoiceStatus } from "@prisma/client";
import { type RentReminderKind } from "./rent.constants.js";
export declare function computeDueDate(billingYear: number, billingMonth: number, dueDayOfMonth: number): Date;
export declare function ensureRentReminderSettings(organizationId: string): Promise<RentReminderSettings>;
export declare function generateMonthlyRentInvoicesForOrg(params: {
    organizationId: string;
    billingYear: number;
    billingMonth: number;
}): Promise<{
    created: number;
    skipped: number;
}>;
export declare function markOverdueInvoicesGlobally(): Promise<number>;
export declare function enqueueTenantRentReminder(params: {
    organizationId: string;
    invoiceId: string;
    kind: RentReminderKind;
}): Promise<void>;
export declare function runRentReminderSweepForOrg(organizationId: string): Promise<void>;
export declare function runRentReminderSweepAllOrgs(): Promise<void>;
export declare function generateCurrentMonthForAllOrgs(): Promise<void>;
export declare function getRentDashboard(params: {
    organizationId: string;
    billingYear: number;
    billingMonth: number;
}): Promise<{
    billingYear: number;
    billingMonth: number;
    counts: {
        total: number;
        due: number;
        overdue: number;
        paid: number;
    };
    expectedMinor: number;
    collectedMinor: number;
    outstandingMinor: number;
    collectionRate: number;
}>;
export declare function listRentInvoices(params: {
    organizationId: string;
    query: {
        page: number;
        pageSize: number;
        status?: RentInvoiceStatus;
        billingYear?: number;
        billingMonth?: number;
    };
}): Promise<{
    items: ({
        bed: {
            id: string;
            label: string;
            room: {
                name: string;
                floor: {
                    name: string;
                };
            };
        };
        tenant: {
            name: string | null;
            id: string;
            phone: string | null;
        };
    } & {
        status: import("@prisma/client").$Enums.RentInvoiceStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        tenantUserId: string;
        bedId: string;
        billingYear: number;
        billingMonth: number;
        amountMinor: number;
        currency: string;
        dueDate: Date;
        paidAt: Date | null;
        paidAmountMinor: number | null;
        paymentMethod: string | null;
        confirmedByUserId: string | null;
        notes: string | null;
        receiptNumber: string | null;
        reminderLastSentAt: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function confirmRentPayment(params: {
    organizationId: string;
    invoiceId: string;
    actorUserId: string;
    paidAmountMinor?: number;
    paymentMethod?: string;
    notes?: string;
}): Promise<RentInvoice>;
export declare function bulkEnqueueReminders(params: {
    organizationId: string;
    invoiceIds: string[];
}): Promise<{
    enqueued: number;
}>;
export declare function listNotificationJobsForOrg(params: {
    organizationId: string;
    page: number;
    pageSize: number;
}): Promise<{
    items: ({
        deliveries: {
            id: string;
            createdAt: Date;
            channel: string;
            body: string | null;
            jobId: string;
            toPhone: string;
            success: boolean;
            providerSid: string | null;
            errorMessage: string | null;
        }[];
    } & {
        type: string;
        status: import("@prisma/client").$Enums.NotificationJobStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        attemptCount: number;
        payload: Prisma.JsonValue;
        scheduledAt: Date;
        maxAttempts: number;
        nextAttemptAt: Date | null;
        lastError: string | null;
        lockedAt: Date | null;
        processedAt: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getRentInvoiceForReceipt(params: {
    organizationId: string;
    invoiceId: string;
}): Promise<({
    bed: {
        label: string;
        room: {
            name: string;
            floor: {
                name: string;
            };
        };
    };
    tenant: {
        name: string | null;
        phone: string | null;
        email: string | null;
    };
    organization: {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        city: string;
        addressLine1: string | null;
        addressLine2: string | null;
        locality: string | null;
        pincode: string | null;
        onboardingCompletedAt: Date | null;
    };
    confirmedBy: {
        name: string | null;
    } | null;
} & {
    status: import("@prisma/client").$Enums.RentInvoiceStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string;
    tenantUserId: string;
    bedId: string;
    billingYear: number;
    billingMonth: number;
    amountMinor: number;
    currency: string;
    dueDate: Date;
    paidAt: Date | null;
    paidAmountMinor: number | null;
    paymentMethod: string | null;
    confirmedByUserId: string | null;
    notes: string | null;
    receiptNumber: string | null;
    reminderLastSentAt: Date | null;
}) | null>;
export declare function listTenantRentInvoices(userId: string): Promise<({
    bed: {
        label: string;
        room: {
            name: string;
            floor: {
                name: string;
            };
        };
    };
    organization: {
        name: string;
        id: string;
        city: string;
    };
} & {
    status: import("@prisma/client").$Enums.RentInvoiceStatus;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    organizationId: string;
    tenantUserId: string;
    bedId: string;
    billingYear: number;
    billingMonth: number;
    amountMinor: number;
    currency: string;
    dueDate: Date;
    paidAt: Date | null;
    paidAmountMinor: number | null;
    paymentMethod: string | null;
    confirmedByUserId: string | null;
    notes: string | null;
    receiptNumber: string | null;
    reminderLastSentAt: Date | null;
})[]>;
