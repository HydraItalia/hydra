-- Issue #104: Payment Failure & Recovery Handling
-- Add payment tracking fields to SubOrder for retry logic and error tracking
-- Add payment failure tracking columns
ALTER TABLE "SubOrder"
ADD COLUMN "paymentAttemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubOrder"
ADD COLUMN "lastPaymentAttemptAt" TIMESTAMP(3);
ALTER TABLE "SubOrder"
ADD COLUMN "nextPaymentRetryAt" TIMESTAMP(3);
ALTER TABLE "SubOrder"
ADD COLUMN "paymentLastErrorCode" TEXT;
ALTER TABLE "SubOrder"
ADD COLUMN "paymentLastErrorMessage" TEXT;
ALTER TABLE "SubOrder"
ADD COLUMN "authorizationExpiresAt" TIMESTAMP(3);
ALTER TABLE "SubOrder"
ADD COLUMN "requiresClientUpdate" BOOLEAN NOT NULL DEFAULT false;
-- Add index for efficient cron job queries (finding SubOrders eligible for retry)
CREATE INDEX "SubOrder_paymentStatus_nextPaymentRetryAt_idx" ON "SubOrder"("paymentStatus", "nextPaymentRetryAt");