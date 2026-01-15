-- Add fee tracking fields to SubOrder for accounting separation (Phase 11)
-- NOTE: These fields are passive/nullable - no Stripe logic uses them yet
-- Fees will not be automatically deducted until legal approval

-- AlterTable: SubOrder - Add fee tracking columns
ALTER TABLE "SubOrder" ADD COLUMN "hydraFeeCents" INTEGER;
ALTER TABLE "SubOrder" ADD COLUMN "hydraFeePercent" DOUBLE PRECISION;
