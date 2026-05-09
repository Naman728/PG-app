import type { NotificationJob, Prisma } from "@prisma/client";
import { NotificationJobStatus } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { logger } from "../../services/logger.service.js";

const STALE_LOCK_MS = 5 * 60 * 1000;

function backoffMs(attemptCount: number): number {
  const base = 30_000;
  const exp = Math.min(attemptCount, 8);
  return Math.min(30 * 60 * 1000, base * 2 ** exp);
}

export async function enqueueNotificationJob(params: {
  organizationId: string;
  type: string;
  payload: Prisma.InputJsonValue;
  scheduledAt?: Date;
  maxAttempts?: number;
}): Promise<NotificationJob> {
  return prisma.notificationJob.create({
    data: {
      organizationId: params.organizationId,
      type: params.type,
      payload: params.payload,
      scheduledAt: params.scheduledAt ?? new Date(),
      maxAttempts: params.maxAttempts ?? 6,
      status: NotificationJobStatus.QUEUED,
    },
  });
}

export async function reclaimStaleProcessingJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_LOCK_MS);
  const res = await prisma.notificationJob.updateMany({
    where: {
      status: NotificationJobStatus.PROCESSING,
      lockedAt: { lt: cutoff },
    },
    data: {
      status: NotificationJobStatus.QUEUED,
      lockedAt: null,
      lastError: "Stale lock reclaimed",
    },
  });
  if (res.count > 0) {
    logger.warn({ message: "notification_jobs_reclaimed", count: res.count });
  }
  return res.count;
}

export async function claimNextNotificationJob(): Promise<NotificationJob | null> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.notificationJob.findFirst({
      where: {
        status: { in: [NotificationJobStatus.QUEUED, NotificationJobStatus.FAILED] },
        scheduledAt: { lte: now },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });
    if (!candidate) return null;

    const updated = await tx.notificationJob.updateMany({
      where: {
        id: candidate.id,
        status: { in: [NotificationJobStatus.QUEUED, NotificationJobStatus.FAILED] },
      },
      data: {
        status: NotificationJobStatus.PROCESSING,
        lockedAt: now,
        attemptCount: { increment: 1 },
      },
    });
    if (updated.count !== 1) return null;
    return tx.notificationJob.findUniqueOrThrow({ where: { id: candidate.id } });
  });
}

export async function markJobSent(jobId: string): Promise<void> {
  await prisma.notificationJob.update({
    where: { id: jobId },
    data: {
      status: NotificationJobStatus.SENT,
      processedAt: new Date(),
      lockedAt: null,
      lastError: null,
    },
  });
}

export async function markJobRetryOrDead(job: NotificationJob, err: unknown): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const attempts = job.attemptCount;
  if (attempts >= job.maxAttempts) {
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: NotificationJobStatus.DEAD,
        lastError: message,
        lockedAt: null,
        processedAt: new Date(),
      },
    });
    logger.error({ message: "notification_job_dead", jobId: job.id, type: job.type, err: message });
    return;
  }
  const delay = backoffMs(attempts);
  await prisma.notificationJob.update({
    where: { id: job.id },
    data: {
      status: NotificationJobStatus.FAILED,
      lastError: message,
      lockedAt: null,
      nextAttemptAt: new Date(Date.now() + delay),
    },
  });
}

export async function drainNotificationQueue(maxJobs: number): Promise<number> {
  let done = 0;
  for (let i = 0; i < maxJobs; i += 1) {
    const job = await claimNextNotificationJob();
    if (!job) break;
    try {
      const { processNotificationJob } = await import("./notification-worker.service.js");
      await processNotificationJob(job);
      done += 1;
    } catch (err) {
      logger.error({ message: "notification_worker_unhandled", jobId: job.id, err });
      await markJobRetryOrDead(job, err);
    }
  }
  return done;
}
