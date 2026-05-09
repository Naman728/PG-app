import { z } from "zod";
export const rentInvoiceStatusSchema = z.enum(["DUE", "PAID", "OVERDUE", "WAIVED"]);
export const listRentInvoicesQueryDto = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    status: rentInvoiceStatusSchema.optional(),
    billingYear: z.coerce.number().int().min(2000).max(2100).optional(),
    billingMonth: z.coerce.number().int().min(1).max(12).optional(),
});
export const confirmRentPaymentDto = z.object({
    paidAmountMinor: z.number().int().positive().optional(),
    paymentMethod: z.string().max(64).optional(),
    notes: z.string().max(2000).optional(),
});
export const bulkRemindRentDto = z.object({
    invoiceIds: z.array(z.string().uuid()).min(1).max(200),
});
export const updateRentReminderSettingsDto = z
    .object({
    dueDayOfMonth: z.number().int().min(1).max(28),
    remindDaysBefore: z.number().int().min(0).max(21),
    overdueRepeatDays: z.number().int().min(1).max(30),
    whatsappEnabled: z.boolean(),
    smsFallbackEnabled: z.boolean(),
    ownerOverdueDigestEnabled: z.boolean(),
})
    .partial();
