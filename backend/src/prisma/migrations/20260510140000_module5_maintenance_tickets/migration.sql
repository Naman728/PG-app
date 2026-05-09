-- CreateEnum
CREATE TYPE "MaintenanceTicketCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'FURNITURE', 'PEST', 'CLEANING', 'STRUCTURAL', 'INTERNET', 'COMMON_AREA', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceTicketStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'BLOCKED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MaintenanceMessageVisibility" AS ENUM ('INTERNAL', 'TENANT');

-- CreateTable
CREATE TABLE "MaintenanceTicket" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "tenantUserId" UUID NOT NULL,
    "bedId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "MaintenanceTicketCategory" NOT NULL,
    "priority" "MaintenanceTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceTicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToUserId" UUID,
    "resolutionSummary" TEXT,
    "resolutionCostMinor" INTEGER,
    "resolvedAt" TIMESTAMP(3),
    "resolutionRating" INTEGER,
    "resolutionFeedback" TEXT,
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MaintenanceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicketAttachment" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceTicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicketMessage" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "MaintenanceMessageVisibility" NOT NULL DEFAULT 'TENANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceTicketActivity" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "actorUserId" UUID,
    "activityType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceTicketActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MaintenanceTicketAttachment_cloudinaryPublicId_key" ON "MaintenanceTicketAttachment"("cloudinaryPublicId");

CREATE INDEX "MaintenanceTicket_organizationId_status_priority_updatedAt_idx" ON "MaintenanceTicket"("organizationId", "status", "priority", "updatedAt");

CREATE INDEX "MaintenanceTicket_organizationId_category_status_idx" ON "MaintenanceTicket"("organizationId", "category", "status");

CREATE INDEX "MaintenanceTicket_tenantUserId_status_idx" ON "MaintenanceTicket"("tenantUserId", "status");

CREATE INDEX "MaintenanceTicket_assignedToUserId_status_idx" ON "MaintenanceTicket"("assignedToUserId", "status");

CREATE INDEX "MaintenanceTicket_organizationId_createdAt_idx" ON "MaintenanceTicket"("organizationId", "createdAt");

CREATE INDEX "MaintenanceTicketAttachment_ticketId_createdAt_idx" ON "MaintenanceTicketAttachment"("ticketId", "createdAt");

CREATE INDEX "MaintenanceTicketMessage_ticketId_createdAt_idx" ON "MaintenanceTicketMessage"("ticketId", "createdAt");

CREATE INDEX "MaintenanceTicketActivity_ticketId_createdAt_idx" ON "MaintenanceTicketActivity"("ticketId", "createdAt");

ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketAttachment" ADD CONSTRAINT "MaintenanceTicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketAttachment" ADD CONSTRAINT "MaintenanceTicketAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketMessage" ADD CONSTRAINT "MaintenanceTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketMessage" ADD CONSTRAINT "MaintenanceTicketMessage_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketActivity" ADD CONSTRAINT "MaintenanceTicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceTicketActivity" ADD CONSTRAINT "MaintenanceTicketActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
