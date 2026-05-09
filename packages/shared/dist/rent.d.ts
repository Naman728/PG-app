import { z } from "zod";
export declare const rentInvoiceStatusSchema: z.ZodEnum<["DUE", "PAID", "OVERDUE", "WAIVED"]>;
export declare const listRentInvoicesQueryDto: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DUE", "PAID", "OVERDUE", "WAIVED"]>>;
    billingYear: z.ZodOptional<z.ZodNumber>;
    billingMonth: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    status?: "DUE" | "PAID" | "OVERDUE" | "WAIVED" | undefined;
    billingYear?: number | undefined;
    billingMonth?: number | undefined;
}, {
    status?: "DUE" | "PAID" | "OVERDUE" | "WAIVED" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    billingYear?: number | undefined;
    billingMonth?: number | undefined;
}>;
export type ListRentInvoicesQuery = z.infer<typeof listRentInvoicesQueryDto>;
export declare const confirmRentPaymentDto: z.ZodObject<{
    paidAmountMinor: z.ZodOptional<z.ZodNumber>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paidAmountMinor?: number | undefined;
    paymentMethod?: string | undefined;
    notes?: string | undefined;
}, {
    paidAmountMinor?: number | undefined;
    paymentMethod?: string | undefined;
    notes?: string | undefined;
}>;
export type ConfirmRentPaymentInput = z.infer<typeof confirmRentPaymentDto>;
export declare const bulkRemindRentDto: z.ZodObject<{
    invoiceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    invoiceIds: string[];
}, {
    invoiceIds: string[];
}>;
export type BulkRemindRentInput = z.infer<typeof bulkRemindRentDto>;
export declare const updateRentReminderSettingsDto: z.ZodObject<{
    dueDayOfMonth: z.ZodOptional<z.ZodNumber>;
    remindDaysBefore: z.ZodOptional<z.ZodNumber>;
    overdueRepeatDays: z.ZodOptional<z.ZodNumber>;
    whatsappEnabled: z.ZodOptional<z.ZodBoolean>;
    smsFallbackEnabled: z.ZodOptional<z.ZodBoolean>;
    ownerOverdueDigestEnabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    dueDayOfMonth?: number | undefined;
    remindDaysBefore?: number | undefined;
    overdueRepeatDays?: number | undefined;
    whatsappEnabled?: boolean | undefined;
    smsFallbackEnabled?: boolean | undefined;
    ownerOverdueDigestEnabled?: boolean | undefined;
}, {
    dueDayOfMonth?: number | undefined;
    remindDaysBefore?: number | undefined;
    overdueRepeatDays?: number | undefined;
    whatsappEnabled?: boolean | undefined;
    smsFallbackEnabled?: boolean | undefined;
    ownerOverdueDigestEnabled?: boolean | undefined;
}>;
export type UpdateRentReminderSettingsInput = z.infer<typeof updateRentReminderSettingsDto>;
//# sourceMappingURL=rent.d.ts.map