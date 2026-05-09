-- CreateEnum
CREATE TYPE "RentInvoiceStatus" AS ENUM ('DUE', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "NotificationJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- CreateTable
CREATE TABLE "RentReminderSettings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "dueDayOfMonth" INTEGER NOT NULL DEFAULT 5,
    "remindDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "overdueRepeatDays" INTEGER NOT NULL DEFAULT 3,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsFallbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ownerOverdueDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentReminderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentInvoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "bedId" UUID NOT NULL,
    "tenantUserId" UUID NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "billingMonth" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "RentInvoiceStatus" NOT NULL DEFAULT 'DUE',
    "paidAt" TIMESTAMP(3),
    "paidAmountMinor" INTEGER,
    "paymentMethod" TEXT,
    "confirmedByUserId" UUID,
    "notes" TEXT,
    "receiptNumber" TEXT,
    "reminderLastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationJobStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 6,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lockedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "providerSid" TEXT,
    "errorMessage" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentReminderSettings_organizationId_key" ON "RentReminderSettings"("organizationId");

CREATE UNIQUE INDEX "RentInvoice_bedId_billingYear_billingMonth_key" ON "RentInvoice"("bedId", "billingYear", "billingMonth");

CREATE INDEX "RentInvoice_organizationId_billingYear_billingMonth_idx" ON "RentInvoice"("organizationId", "billingYear", "billingMonth");

CREATE INDEX "RentInvoice_organizationId_status_idx" ON "RentInvoice"("organizationId", "status");

CREATE INDEX "RentInvoice_tenantUserId_status_idx" ON "RentInvoice"("tenantUserId", "status");

CREATE INDEX "NotificationJob_status_scheduledAt_nextAttemptAt_idx" ON "NotificationJob"("status", "scheduledAt", "nextAttemptAt");

CREATE INDEX "NotificationJob_organizationId_createdAt_idx" ON "NotificationJob"("organizationId", "createdAt");

CREATE INDEX "NotificationDelivery_jobId_createdAt_idx" ON "NotificationDelivery"("jobId", "createdAt");

ALTER TABLE "RentReminderSettings" ADD CONSTRAINT "RentReminderSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentInvoice" ADD CONSTRAINT "RentInvoice_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationJob" ADD CONSTRAINT "NotificationJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "NotificationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
