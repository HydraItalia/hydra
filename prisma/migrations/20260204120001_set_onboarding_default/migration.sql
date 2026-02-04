-- AlterTable: change User status default from PENDING to ONBOARDING
ALTER TABLE "User"
ALTER COLUMN "status"
SET DEFAULT 'ONBOARDING';