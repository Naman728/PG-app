-- Room sharing label + in-app notifications + SMS fallback default off
ALTER TABLE "Room" ADD COLUMN "sharingLabel" TEXT;
CREATE INDEX "Room_floorId_name_idx" ON "Room" ("floorId", "name");

CREATE TABLE "InAppNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InAppNotification_userId_readAt_idx" ON "InAppNotification" ("userId", "readAt");
CREATE INDEX "InAppNotification_userId_createdAt_idx" ON "InAppNotification" ("userId", "createdAt");
CREATE INDEX "InAppNotification_organizationId_createdAt_idx" ON "InAppNotification" ("organizationId", "createdAt");

ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentReminderSettings" ALTER COLUMN "smsFallbackEnabled" SET DEFAULT false;
UPDATE "RentReminderSettings" SET "smsFallbackEnabled" = false;
