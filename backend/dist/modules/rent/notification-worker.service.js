import { RentInvoiceStatus } from "@prisma/client";
import { loadEnv } from "../../config/env.js";
import { prisma } from "../../prisma/client.js";
import { logger } from "../../services/logger.service.js";
import { sendSmsPlain, sendWhatsAppPlain } from "../../services/twilio.service.js";
import { MAINTENANCE_NOTIFICATION_TYPES, } from "../maintenance/maintenance.constants.js";
import { NOTIFICATION_JOB_TYPES, } from "./rent.constants.js";
import { createInAppNotification } from "../../services/in-app-notification.service.js";
import { markJobRetryOrDead, markJobSent } from "./notification-queue.service.js";
import { smsToField, toE164Phone } from "./phone.util.js";
function formatInr(minor) {
    return (minor / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}
async function logDelivery(params) {
    await prisma.notificationDelivery.create({
        data: {
            jobId: params.jobId,
            channel: params.channel,
            toPhone: params.toPhone,
            success: params.success,
            providerSid: params.providerSid,
            errorMessage: params.errorMessage,
            body: params.body,
        },
    });
}
async function tryWhatsAppThenSms(params) {
    const e164 = toE164Phone(params.phone);
    let sent = false;
    if (params.whatsappEnabled) {
        try {
            const { sid } = await sendWhatsAppPlain({ toE164: e164, body: params.body });
            await logDelivery({
                jobId: params.jobId,
                channel: "whatsapp",
                toPhone: e164,
                success: true,
                providerSid: sid,
                body: params.body,
            });
            sent = true;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn({ message: "rent_whatsapp_failed", jobId: params.jobId, err: msg });
            await logDelivery({
                jobId: params.jobId,
                channel: "whatsapp",
                toPhone: e164,
                success: false,
                errorMessage: msg,
                body: params.body,
            });
        }
    }
    if (sent)
        return true;
    if (!params.smsFallbackEnabled)
        return false;
    try {
        const smsTo = smsToField(params.phone);
        const { sid } = await sendSmsPlain({ to: smsTo, body: params.body });
        await logDelivery({
            jobId: params.jobId,
            channel: "sms",
            toPhone: smsTo,
            success: true,
            providerSid: sid,
            body: params.body,
        });
        return true;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logDelivery({
            jobId: params.jobId,
            channel: "sms",
            toPhone: smsToField(params.phone),
            success: false,
            errorMessage: msg,
            body: params.body,
        });
        return false;
    }
}
export async function processNotificationJob(job) {
    if (job.type === NOTIFICATION_JOB_TYPES.RENT_TENANT_REMINDER) {
        await processTenantReminder(job);
        return;
    }
    if (job.type === NOTIFICATION_JOB_TYPES.RENT_OWNER_OVERDUE_DIGEST) {
        await processOwnerDigest(job);
        return;
    }
    if (job.type === MAINTENANCE_NOTIFICATION_TYPES.STAFF_ALERT) {
        await processMaintenanceStaffAlert(job);
        return;
    }
    if (job.type === MAINTENANCE_NOTIFICATION_TYPES.TENANT_ALERT) {
        await processMaintenanceTenantAlert(job);
        return;
    }
    await markJobRetryOrDead(job, new Error(`Unknown job type: ${job.type}`));
}
async function processTenantReminder(job) {
    const payload = job.payload;
    const invoice = await prisma.rentInvoice.findFirst({
        where: { id: payload.invoiceId, organizationId: job.organizationId },
        include: {
            organization: true,
            tenant: { select: { id: true, name: true, phone: true } },
        },
    });
    if (!invoice) {
        await markJobSent(job.id);
        return;
    }
    if (invoice.status === RentInvoiceStatus.PAID || invoice.status === RentInvoiceStatus.WAIVED) {
        await markJobSent(job.id);
        return;
    }
    const settings = (await prisma.rentReminderSettings.findUnique({
        where: { organizationId: job.organizationId },
    })) ??
        (await prisma.rentReminderSettings.create({
            data: { organizationId: job.organizationId },
        }));
    const tenantName = invoice.tenant.name?.trim() || "there";
    const orgName = invoice.organization.name;
    const period = `${String(invoice.billingMonth).padStart(2, "0")}/${invoice.billingYear}`;
    const dueStr = invoice.dueDate.toLocaleDateString("en-IN", { dateStyle: "medium" });
    const amount = formatInr(invoice.amountMinor);
    let body;
    if (payload.kind === "OVERDUE") {
        body = `PG Manager — Hi ${tenantName}, your rent of ₹${amount} for ${period} at ${orgName} was due on ${dueStr}. Please pay at the earliest.`;
    }
    else if (payload.kind === "UPCOMING") {
        body = `PG Manager — Hi ${tenantName}, rent of ₹${amount} for ${period} at ${orgName} is due on ${dueStr}. Please pay on time.`;
    }
    else {
        body = `PG Manager — Hi ${tenantName}, friendly reminder: rent of ₹${amount} for ${period} at ${orgName} is ${invoice.status === RentInvoiceStatus.OVERDUE ? "overdue" : "due"} (${dueStr}).`;
    }
    await createInAppNotification({
        userId: invoice.tenantUserId,
        organizationId: job.organizationId,
        category: "RENT_REMINDER",
        title: payload.kind === "OVERDUE"
            ? "Rent overdue"
            : payload.kind === "UPCOMING"
                ? "Rent due soon"
                : "Rent reminder",
        body,
        metadata: { invoiceId: invoice.id, kind: payload.kind },
    });
    if (invoice.tenant.phone) {
        await tryWhatsAppThenSms({
            jobId: job.id,
            phone: invoice.tenant.phone,
            body,
            whatsappEnabled: settings.whatsappEnabled,
            smsFallbackEnabled: settings.smsFallbackEnabled,
        });
    }
    if (payload.kind !== "UPCOMING") {
        await prisma.rentInvoice.update({
            where: { id: invoice.id },
            data: { reminderLastSentAt: new Date() },
        });
    }
    await markJobSent(job.id);
}
async function processOwnerDigest(job) {
    const payload = job.payload;
    const user = await prisma.user.findFirst({
        where: { id: payload.recipientUserId, deletedAt: null },
        select: { id: true, phone: true, name: true },
    });
    if (!user) {
        await markJobSent(job.id);
        return;
    }
    const org = await prisma.organization.findFirst({
        where: { id: job.organizationId, deletedAt: null },
    });
    if (!org) {
        await markJobSent(job.id);
        return;
    }
    const settings = (await prisma.rentReminderSettings.findUnique({
        where: { organizationId: job.organizationId },
    })) ??
        (await prisma.rentReminderSettings.create({
            data: { organizationId: job.organizationId },
        }));
    if (!settings.ownerOverdueDigestEnabled) {
        await markJobSent(job.id);
        return;
    }
    const env = loadEnv();
    const dashboardUrl = `${env.FRONTEND_URL}/owner/rent`;
    const body = `PG Manager — ${org.name}: you have ${payload.overdueCount} overdue rent invoice(s). Review collections: ${dashboardUrl}`;
    await createInAppNotification({
        userId: user.id,
        organizationId: job.organizationId,
        category: "OWNER_RENT_DIGEST",
        title: "Overdue rent digest",
        body,
        metadata: { overdueCount: payload.overdueCount },
    });
    if (user.phone) {
        await tryWhatsAppThenSms({
            jobId: job.id,
            phone: user.phone,
            body,
            whatsappEnabled: settings.whatsappEnabled,
            smsFallbackEnabled: settings.smsFallbackEnabled,
        });
    }
    await markJobSent(job.id);
}
async function loadOrgNotificationPrefs(organizationId) {
    const settings = await prisma.rentReminderSettings.findUnique({
        where: { organizationId },
    });
    return {
        whatsappEnabled: settings?.whatsappEnabled ?? true,
        smsFallbackEnabled: settings?.smsFallbackEnabled ?? false,
    };
}
async function processMaintenanceStaffAlert(job) {
    const payload = job.payload;
    const user = await prisma.user.findFirst({
        where: { id: payload.recipientUserId, deletedAt: null },
        select: { id: true, phone: true },
    });
    if (!user) {
        await markJobSent(job.id);
        return;
    }
    const org = await prisma.organization.findFirst({
        where: { id: job.organizationId, deletedAt: null },
    });
    if (!org) {
        await markJobSent(job.id);
        return;
    }
    const env = loadEnv();
    const link = `${env.FRONTEND_URL}/owner/maintenance/${payload.ticketId}`;
    const body = `PG Manager — ${payload.headline} at ${org.name}: ${payload.detail}. Open: ${link}`;
    await createInAppNotification({
        userId: user.id,
        organizationId: job.organizationId,
        category: "MAINTENANCE_STAFF",
        title: payload.headline,
        body,
        metadata: { ticketId: payload.ticketId, link },
    });
    const prefs = await loadOrgNotificationPrefs(job.organizationId);
    if (user.phone) {
        await tryWhatsAppThenSms({
            jobId: job.id,
            phone: user.phone,
            body,
            whatsappEnabled: prefs.whatsappEnabled,
            smsFallbackEnabled: prefs.smsFallbackEnabled,
        });
    }
    await markJobSent(job.id);
}
async function processMaintenanceTenantAlert(job) {
    const payload = job.payload;
    const user = await prisma.user.findFirst({
        where: { id: payload.recipientUserId, deletedAt: null },
        select: { id: true, phone: true },
    });
    if (!user) {
        await markJobSent(job.id);
        return;
    }
    const org = await prisma.organization.findFirst({
        where: { id: job.organizationId, deletedAt: null },
    });
    if (!org) {
        await markJobSent(job.id);
        return;
    }
    const env = loadEnv();
    const link = `${env.FRONTEND_URL}/tenant/maintenance/${payload.ticketId}`;
    const body = `PG Manager — ${payload.headline} (${org.name}): ${payload.detail}. Details: ${link}`;
    await createInAppNotification({
        userId: user.id,
        organizationId: job.organizationId,
        category: "MAINTENANCE_TENANT",
        title: payload.headline,
        body,
        metadata: { ticketId: payload.ticketId, link },
    });
    const prefs = await loadOrgNotificationPrefs(job.organizationId);
    if (user.phone) {
        await tryWhatsAppThenSms({
            jobId: job.id,
            phone: user.phone,
            body,
            whatsappEnabled: prefs.whatsappEnabled,
            smsFallbackEnabled: prefs.smsFallbackEnabled,
        });
    }
    await markJobSent(job.id);
}
//# sourceMappingURL=notification-worker.service.js.map