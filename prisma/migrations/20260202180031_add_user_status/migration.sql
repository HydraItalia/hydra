-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable: add default(cuid()) to User.id, add new fields
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedByUserId" TEXT,
ADD COLUMN "onboardingData" JSONB;

-- Backfill: all existing users are grandfathered as APPROVED
UPDATE "User" SET "status" = 'APPROVED' WHERE "status" = 'PENDING';

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
