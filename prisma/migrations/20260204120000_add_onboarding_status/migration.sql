-- AlterEnum: add ONBOARDING value to UserStatus
ALTER TYPE "UserStatus"
ADD VALUE 'ONBOARDING' BEFORE 'PENDING';