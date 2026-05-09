-- Module 1: onboarding fields, tenant invitations, OrgRole.TENANT

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'OrgRole' AND e.enumlabel = 'TENANT'
  ) THEN
    ALTER TYPE "OrgRole" ADD VALUE 'TENANT';
  END IF;
END
$$;

ALTER TABLE "Organization" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "Organization" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "Organization" ADD COLUMN "locality" TEXT;
ALTER TABLE "Organization" ADD COLUMN "pincode" TEXT;
ALTER TABLE "Organization" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

CREATE TABLE "TenantInvitation" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "invitedByUserId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantInvitation_tokenHash_key" ON "TenantInvitation"("tokenHash");
CREATE INDEX "TenantInvitation_organizationId_phone_idx" ON "TenantInvitation"("organizationId", "phone");
CREATE INDEX "TenantInvitation_expiresAt_idx" ON "TenantInvitation"("expiresAt");

ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TenantInvitation" ADD CONSTRAINT "TenantInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
