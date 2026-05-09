-- CreateEnum
CREATE TYPE "TenantLifecycleStatus" AS ENUM ('ONBOARDING', 'PENDING_REVIEW', 'ACTIVE', 'MOVING_OUT', 'MOVED_OUT', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TenantDocumentCategory" AS ENUM ('AADHAAR_FRONT', 'AADHAAR_BACK', 'PROFILE_PHOTO', 'RENT_AGREEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "TenantDocumentReviewStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "TenantLifecycleStatus" NOT NULL DEFAULT 'ONBOARDING',
    "moveInAt" TIMESTAMP(3),
    "moveOutAt" TIMESTAMP(3),
    "aadhaarLast4" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "occupation" TEXT,
    "permanentAddress" TEXT,
    "kycSubmittedAt" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),
    "statusNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantDocument" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "category" "TenantDocumentCategory" NOT NULL,
    "reviewStatus" "TenantDocumentReviewStatus" NOT NULL DEFAULT 'UPLOADED',
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'image',
    "reviewNote" TEXT,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TenantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantEmergencyContact" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TenantEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_organizationId_userId_key" ON "Tenant"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Tenant_organizationId_status_idx" ON "Tenant"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantDocument_cloudinaryPublicId_key" ON "TenantDocument"("cloudinaryPublicId");

-- CreateIndex
CREATE INDEX "TenantDocument_tenantId_idx" ON "TenantDocument"("tenantId");

-- CreateIndex
CREATE INDEX "TenantDocument_organizationId_reviewStatus_idx" ON "TenantDocument"("organizationId", "reviewStatus");

-- CreateIndex
CREATE INDEX "TenantEmergencyContact_tenantId_idx" ON "TenantEmergencyContact"("tenantId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantDocument" ADD CONSTRAINT "TenantDocument_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantEmergencyContact" ADD CONSTRAINT "TenantEmergencyContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
