import type { Prisma, RentInvoice, RentReminderSettings } from "@prisma/client";
import { BedStatus, NotificationJobStatus, OrgRole, RentInvoiceStatus } from "@prisma/client";
import { resolveTenantOrganizationId } from "../../common/resolveTenantOrg.js";
import { badRequest, notFound } from "../../common/httpErrors.js";
import { prisma } from "../../prisma/client.js";
import { logger } from "../../services/logger.service.js";
import {
  NOTIFICATION_JOB_TYPES,
  type RentOwnerDigestPayload,
  type RentReminderKind,
  type RentTenantReminderPayload,
} from "./rent.constants.js";
import { enqueueNotificationJob } from "./notification-queue.service.js";

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetweenUtc(a: Date, b: Date): number {
  const ua = utcDayStart(a).getTime();
  const ub = utcDayStart(b).getTime();
  return Math.round((ub - ua) / 86_400_000);
}

export function computeDueDate(
  billingYear: number,
  billingMonth: number,
  dueDayOfMonth: number,
): Date {
  const lastDay = new Date(Date.UTC(billingYear, billingMonth, 0)).getUTCDate();
  const day = Math.min(Math.max(1, dueDayOfMonth), 28, lastDay);
  return new Date(Date.UTC(billingYear, billingMonth - 1, day, 12, 0, 0));
}

export async function ensureRentReminderSettings(
  organizationId: string,
): Promise<RentReminderSettings> {
  const existing = await prisma.rentReminderSettings.findUnique({
    where: { organizationId },
  });
  if (existing) return existing;
  return prisma.rentReminderSettings.create({
    data: { organizationId },
  });
}

export async function generateMonthlyRentInvoicesForOrg(params: {
  organizationId: string;
  billingYear: number;
  billingMonth: number;
}): Promise<{ created: number; skipped: number }> {
  const settings = await ensureRentReminderSettings(params.organizationId);
  const dueDate = computeDueDate(
    params.billingYear,
    params.billingMonth,
    settings.dueDayOfMonth,
  );

  const beds = await prisma.bed.findMany({
    where: {
      deletedAt: null,
      tenantUserId: { not: null },
      status: { in: [BedStatus.OCCUPIED_PAID, BedStatus.OCCUPIED_UNPAID] },
      room: {
        deletedAt: null,
        floor: {
          deletedAt: null,
          organizationId: params.organizationId,
        },
      },
    },
    select: {
      id: true,
      monthlyRentMinor: true,
      tenantUserId: true,
    },
  });

  let created = 0;
  let skipped = 0;
  for (const bed of beds) {
    if (!bed.tenantUserId) {
      skipped += 1;
      continue;
    }
    if (bed.monthlyRentMinor <= 0) {
      skipped += 1;
      continue;
    }
    try {
      await prisma.rentInvoice.create({
        data: {
          organizationId: params.organizationId,
          bedId: bed.id,
          tenantUserId: bed.tenantUserId,
          billingYear: params.billingYear,
          billingMonth: params.billingMonth,
          amountMinor: bed.monthlyRentMinor,
          dueDate,
          status: RentInvoiceStatus.DUE,
        },
      });
      created += 1;
    } catch {
      skipped += 1;
    }
  }
  logger.info({
    message: "rent_month_generated",
    organizationId: params.organizationId,
    billingYear: params.billingYear,
    billingMonth: params.billingMonth,
    created,
    skipped,
  });
  return { created, skipped };
}

export async function markOverdueInvoicesGlobally(): Promise<number> {
  const startToday = utcDayStart(new Date());
  const res = await prisma.rentInvoice.updateMany({
    where: {
      status: RentInvoiceStatus.DUE,
      dueDate: { lt: startToday },
    },
    data: { status: RentInvoiceStatus.OVERDUE },
  });
  if (res.count > 0) {
    logger.info({ message: "rent_marked_overdue", count: res.count });
  }
  return res.count;
}

async function hasRecentQueuedTenantReminder(params: {
  organizationId: string;
  invoiceId: string;
  withinMs: number;
}): Promise<boolean> {
  const since = new Date(Date.now() - params.withinMs);
  const recent = await prisma.notificationJob.findMany({
    where: {
      organizationId: params.organizationId,
      type: NOTIFICATION_JOB_TYPES.RENT_TENANT_REMINDER,
      status: { in: [NotificationJobStatus.QUEUED, NotificationJobStatus.PROCESSING] },
      createdAt: { gte: since },
    },
    select: { payload: true },
    take: 200,
  });
  return recent.some(
    (j) => (j.payload as RentTenantReminderPayload | null)?.invoiceId === params.invoiceId,
  );
}

export async function enqueueTenantRentReminder(params: {
  organizationId: string;
  invoiceId: string;
  kind: RentReminderKind;
}): Promise<void> {
  const recent = await hasRecentQueuedTenantReminder({
    organizationId: params.organizationId,
    invoiceId: params.invoiceId,
    withinMs: 2 * 60 * 60 * 1000,
  });
  if (recent) return;

  const payload: RentTenantReminderPayload = {
    invoiceId: params.invoiceId,
    kind: params.kind,
  };
  await enqueueNotificationJob({
    organizationId: params.organizationId,
    type: NOTIFICATION_JOB_TYPES.RENT_TENANT_REMINDER,
    payload,
  });
}

export async function runRentReminderSweepForOrg(organizationId: string): Promise<void> {
  const settings = await ensureRentReminderSettings(organizationId);
  const today = utcDayStart(new Date());

  const dueInvoices = await prisma.rentInvoice.findMany({
    where: {
      organizationId,
      status: RentInvoiceStatus.DUE,
    },
    select: {
      id: true,
      dueDate: true,
    },
  });

  for (const inv of dueInvoices) {
    const due = utcDayStart(inv.dueDate);
    const daysUntil = daysBetweenUtc(today, due);
    if (daysUntil === settings.remindDaysBefore) {
      const sent = await prisma.notificationJob.findMany({
        where: {
          organizationId,
          type: NOTIFICATION_JOB_TYPES.RENT_TENANT_REMINDER,
          status: NotificationJobStatus.SENT,
        },
        select: { payload: true },
        take: 500,
      });
      const already = sent.some((j) => {
        const p = j.payload as RentTenantReminderPayload | null;
        return p?.invoiceId === inv.id && p?.kind === "UPCOMING";
      });
      if (!already) {
        await enqueueTenantRentReminder({
          organizationId,
          invoiceId: inv.id,
          kind: "UPCOMING",
        });
      }
    }
  }

  const overdueInvoices = await prisma.rentInvoice.findMany({
    where: {
      organizationId,
      status: RentInvoiceStatus.OVERDUE,
    },
    select: {
      id: true,
      dueDate: true,
      reminderLastSentAt: true,
    },
  });

  for (const inv of overdueInvoices) {
    const last = inv.reminderLastSentAt;
    const ok =
      !last || daysBetweenUtc(last, today) >= settings.overdueRepeatDays;
    if (ok) {
      await enqueueTenantRentReminder({
        organizationId,
        invoiceId: inv.id,
        kind: "OVERDUE",
      });
    }
  }

  if (!settings.ownerOverdueDigestEnabled) return;

  const overdueCount = await prisma.rentInvoice.count({
    where: { organizationId, status: RentInvoiceStatus.OVERDUE },
  });
  if (overdueCount === 0) return;

  const startUtcDay = today;
  const digestExists = await prisma.notificationJob.findFirst({
    where: {
      organizationId,
      type: NOTIFICATION_JOB_TYPES.RENT_OWNER_OVERDUE_DIGEST,
      createdAt: { gte: startUtcDay },
    },
  });
  if (digestExists) return;

  const recipients = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      orgRole: { in: [OrgRole.OWNER, OrgRole.MANAGER] },
    },
    select: { userId: true },
  });

  for (const r of recipients) {
    const payload: RentOwnerDigestPayload = {
      recipientUserId: r.userId,
      overdueCount,
    };
    await enqueueNotificationJob({
      organizationId,
      type: NOTIFICATION_JOB_TYPES.RENT_OWNER_OVERDUE_DIGEST,
      payload,
    });
  }
}

export async function runRentReminderSweepAllOrgs(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const o of orgs) {
    await runRentReminderSweepForOrg(o.id);
  }
}

export async function generateCurrentMonthForAllOrgs(): Promise<void> {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  for (const o of orgs) {
    await generateMonthlyRentInvoicesForOrg({
      organizationId: o.id,
      billingYear: year,
      billingMonth: month,
    });
  }
}

export async function getRentDashboard(params: {
  organizationId: string;
  billingYear: number;
  billingMonth: number;
}) {
  const { organizationId, billingYear, billingMonth } = params;
  const whereMonth: Prisma.RentInvoiceWhereInput = {
    organizationId,
    billingYear,
    billingMonth,
  };

  const [total, due, overdue, paid, collectedAgg] = await Promise.all([
    prisma.rentInvoice.count({ where: whereMonth }),
    prisma.rentInvoice.count({
      where: { ...whereMonth, status: RentInvoiceStatus.DUE },
    }),
    prisma.rentInvoice.count({
      where: { ...whereMonth, status: RentInvoiceStatus.OVERDUE },
    }),
    prisma.rentInvoice.count({
      where: { ...whereMonth, status: RentInvoiceStatus.PAID },
    }),
    prisma.rentInvoice.aggregate({
      where: { ...whereMonth, status: RentInvoiceStatus.PAID },
      _sum: { paidAmountMinor: true },
    }),
  ]);

  const expectedAgg = await prisma.rentInvoice.aggregate({
    where: { ...whereMonth, status: { not: RentInvoiceStatus.WAIVED } },
    _sum: { amountMinor: true },
  });

  const expectedMinor = expectedAgg._sum.amountMinor ?? 0;
  const collectedMinor = collectedAgg._sum.paidAmountMinor ?? 0;
  const collectionRate =
    expectedMinor > 0 ? Math.min(1, collectedMinor / expectedMinor) : paid > 0 ? 1 : 0;

  return {
    billingYear,
    billingMonth,
    counts: { total, due, overdue, paid },
    expectedMinor,
    collectedMinor,
    outstandingMinor: Math.max(0, expectedMinor - collectedMinor),
    collectionRate,
  };
}

export async function listRentInvoices(params: {
  organizationId: string;
  query: {
    page: number;
    pageSize: number;
    status?: RentInvoiceStatus;
    billingYear?: number;
    billingMonth?: number;
  };
}) {
  const { organizationId, query } = params;
  const where: Prisma.RentInvoiceWhereInput = { organizationId };
  if (query.status) where.status = query.status;
  if (query.billingYear != null) where.billingYear = query.billingYear;
  if (query.billingMonth != null) where.billingMonth = query.billingMonth;

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    prisma.rentInvoice.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }, { dueDate: "asc" }],
      include: {
        tenant: { select: { id: true, name: true, phone: true } },
        bed: {
          select: {
            id: true,
            label: true,
            room: { select: { name: true, floor: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.rentInvoice.count({ where }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function confirmRentPayment(params: {
  organizationId: string;
  invoiceId: string;
  actorUserId: string;
  paidAmountMinor?: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<RentInvoice> {
  const inv = await prisma.rentInvoice.findFirst({
    where: { id: params.invoiceId, organizationId: params.organizationId },
  });
  if (!inv) throw notFound("Invoice not found");
  if (inv.status === RentInvoiceStatus.PAID || inv.status === RentInvoiceStatus.WAIVED) {
    throw badRequest("Invoice already settled");
  }

  const paidAmount = params.paidAmountMinor ?? inv.amountMinor;
  if (paidAmount <= 0) throw badRequest("Invalid amount");

  const receiptNumber = `RCP-${inv.billingYear}${String(inv.billingMonth).padStart(2, "0")}-${inv.id.slice(0, 8).toUpperCase()}`;

  return prisma.rentInvoice.update({
    where: { id: inv.id },
    data: {
      status: RentInvoiceStatus.PAID,
      paidAt: new Date(),
      paidAmountMinor: paidAmount,
      paymentMethod: params.paymentMethod ?? "MANUAL",
      notes: params.notes,
      confirmedByUserId: params.actorUserId,
      receiptNumber,
    },
  });
}

export async function bulkEnqueueReminders(params: {
  organizationId: string;
  invoiceIds: string[];
}): Promise<{ enqueued: number }> {
  const rows = await prisma.rentInvoice.findMany({
    where: {
      id: { in: params.invoiceIds },
      organizationId: params.organizationId,
      status: { in: [RentInvoiceStatus.DUE, RentInvoiceStatus.OVERDUE] },
    },
    select: { id: true },
  });
  let enqueued = 0;
  for (const r of rows) {
    await enqueueTenantRentReminder({
      organizationId: params.organizationId,
      invoiceId: r.id,
      kind: "MANUAL",
    });
    enqueued += 1;
  }
  return { enqueued };
}

export async function listNotificationJobsForOrg(params: {
  organizationId: string;
  page: number;
  pageSize: number;
}) {
  const skip = (params.page - 1) * params.pageSize;
  const [items, total] = await Promise.all([
    prisma.notificationJob.findMany({
      where: { organizationId: params.organizationId },
      orderBy: { createdAt: "desc" },
      skip,
      take: params.pageSize,
      include: {
        deliveries: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.notificationJob.count({ where: { organizationId: params.organizationId } }),
  ]);
  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getRentInvoiceForReceipt(params: {
  organizationId: string;
  invoiceId: string;
}) {
  return prisma.rentInvoice.findFirst({
    where: { id: params.invoiceId, organizationId: params.organizationId },
    include: {
      organization: true,
      tenant: { select: { name: true, phone: true, email: true } },
      confirmedBy: { select: { name: true } },
      bed: {
        select: {
          label: true,
          room: { select: { name: true, floor: { select: { name: true } } } },
        },
      },
    },
  });
}

export async function listTenantRentInvoices(userId: string) {
  const organizationId = await resolveTenantOrganizationId(userId);

  return prisma.rentInvoice.findMany({
    where: { organizationId, tenantUserId: userId },
    orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
    include: {
      organization: { select: { id: true, name: true, city: true } },
      bed: {
        select: {
          label: true,
          room: { select: { name: true, floor: { select: { name: true } } } },
        },
      },
    },
  });
}
