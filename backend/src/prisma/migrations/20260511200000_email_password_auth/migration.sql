-- Email/password auth: optional phone (e.g. email-only accounts), credential hash
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
