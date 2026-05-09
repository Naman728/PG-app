import type { NotificationJob, Prisma } from "@prisma/client";
export declare function enqueueNotificationJob(params: {
    organizationId: string;
    type: string;
    payload: Prisma.InputJsonValue;
    scheduledAt?: Date;
    maxAttempts?: number;
}): Promise<NotificationJob>;
export declare function reclaimStaleProcessingJobs(): Promise<number>;
export declare function claimNextNotificationJob(): Promise<NotificationJob | null>;
export declare function markJobSent(jobId: string): Promise<void>;
export declare function markJobRetryOrDead(job: NotificationJob, err: unknown): Promise<void>;
export declare function drainNotificationQueue(maxJobs: number): Promise<number>;
