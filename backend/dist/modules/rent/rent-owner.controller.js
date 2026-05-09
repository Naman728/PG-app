import { bulkRemindRentDto, listRentInvoicesQueryDto } from "@pg-manager/shared";
import { sendSuccess } from "../../common/apiResponse.js";
import { writeAuditLog } from "../../services/audit.service.js";
import { prisma } from "../../prisma/client.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { buildRentInvoicesWorkbook, buildRentReceiptPdf } from "./rent-export.service.js";
import { bulkEnqueueReminders, confirmRentPayment, ensureRentReminderSettings, generateMonthlyRentInvoicesForOrg, getRentDashboard, getRentInvoiceForReceipt, listNotificationJobsForOrg, listRentInvoices, } from "./rent.service.js";
export const getRentReminderSettings = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const settings = await ensureRentReminderSettings(orgId);
    sendSuccess(res, { settings });
});
export const patchRentReminderSettings = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const body = req.body;
    await ensureRentReminderSettings(orgId);
    const updated = await prisma.rentReminderSettings.update({
        where: { organizationId: orgId },
        data: body,
    });
    sendSuccess(res, { settings: updated });
});
export const getRentDashboardHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const year = Number(req.query.billingYear ?? new Date().getUTCFullYear());
    const month = Number(req.query.billingMonth ?? new Date().getUTCMonth() + 1);
    const dash = await getRentDashboard({
        organizationId: orgId,
        billingYear: year,
        billingMonth: month,
    });
    sendSuccess(res, dash);
});
export const listRentInvoicesHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const parsed = listRentInvoicesQueryDto.parse({
        page: req.query.page,
        pageSize: req.query.pageSize,
        status: req.query.status,
        billingYear: req.query.billingYear,
        billingMonth: req.query.billingMonth,
    });
    const result = await listRentInvoices({
        organizationId: orgId,
        query: parsed,
    });
    sendSuccess(res, result);
});
export const confirmRentPaymentHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const invoiceId = req.params.invoiceId;
    const body = req.body;
    const inv = await confirmRentPayment({
        organizationId: orgId,
        invoiceId,
        actorUserId: req.auth.userId,
        paidAmountMinor: body.paidAmountMinor,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
    });
    void writeAuditLog({
        organizationId: orgId,
        actorUserId: req.auth.userId,
        action: "RENT_PAYMENT_CONFIRMED",
        entityType: "RentInvoice",
        entityId: inv.id,
        metadata: { paidAmountMinor: inv.paidAmountMinor, paymentMethod: inv.paymentMethod },
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    sendSuccess(res, { invoice: inv });
});
export const bulkRemindRentHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const body = bulkRemindRentDto.parse(req.body);
    const result = await bulkEnqueueReminders({
        organizationId: orgId,
        invoiceIds: body.invoiceIds,
    });
    sendSuccess(res, result);
});
export const generateRentMonthHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const now = new Date();
    const year = Number(req.query.billingYear ?? now.getUTCFullYear());
    const month = Number(req.query.billingMonth ?? now.getUTCMonth() + 1);
    const result = await generateMonthlyRentInvoicesForOrg({
        organizationId: orgId,
        billingYear: year,
        billingMonth: month,
    });
    sendSuccess(res, result);
});
export const exportRentExcelHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const status = req.query.status;
    const billingYear = req.query.billingYear
        ? Number(req.query.billingYear)
        : undefined;
    const billingMonth = req.query.billingMonth
        ? Number(req.query.billingMonth)
        : undefined;
    const where = {};
    if (status)
        where.status = status;
    if (billingYear != null && !Number.isNaN(billingYear))
        where.billingYear = billingYear;
    if (billingMonth != null && !Number.isNaN(billingMonth))
        where.billingMonth = billingMonth;
    const buf = await buildRentInvoicesWorkbook({ organizationId: orgId, where });
    res.setHeader("Content-Disposition", `attachment; filename="rent-invoices-${orgId.slice(0, 8)}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buf);
});
export const downloadRentReceiptPdfHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const invoiceId = req.params.invoiceId;
    const inv = await getRentInvoiceForReceipt({ organizationId: orgId, invoiceId });
    if (!inv || inv.status !== "PAID") {
        res.status(404).json({ success: false, error: { message: "Receipt not available" } });
        return;
    }
    const orgBits = [
        inv.organization.addressLine1,
        inv.organization.locality,
        inv.organization.city,
        inv.organization.pincode,
    ]
        .filter(Boolean)
        .join(", ");
    const loc = `${inv.bed.room.floor.name} / ${inv.bed.room.name} / ${inv.bed.label}`;
    const pdf = await buildRentReceiptPdf({
        organizationName: inv.organization.name,
        orgAddress: orgBits || inv.organization.city,
        tenantName: inv.tenant.name ?? "Tenant",
        tenantPhone: inv.tenant.phone ?? inv.tenant.email ?? "—",
        receiptNumber: inv.receiptNumber,
        billingLabel: `${String(inv.billingMonth).padStart(2, "0")}/${inv.billingYear}`,
        amountMinor: inv.paidAmountMinor ?? inv.amountMinor,
        paidAt: inv.paidAt ?? new Date(),
        paymentMethod: inv.paymentMethod,
        locationLabel: loc,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="receipt-${inv.receiptNumber ?? invoiceId}.pdf"`);
    res.send(pdf);
});
export const listRentNotificationJobsHandler = asyncHandler(async (req, res) => {
    const orgId = req.params.orgId;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 20)));
    const result = await listNotificationJobsForOrg({ organizationId: orgId, page, pageSize });
    sendSuccess(res, result);
});
//# sourceMappingURL=rent-owner.controller.js.map