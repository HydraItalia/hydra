-- N1.2: Add VAT snapshot fields to OrderItem/SubOrder + Vendor.priceIncludesVat
-- Issue: #120
-- All new columns are nullable (except priceIncludesVat which has default)
-- Existing orders remain unaffected with NULL values

-- Vendor: Add priceIncludesVat flag (false = NET pricing, true = GROSS pricing)
ALTER TABLE "Vendor" ADD COLUMN "priceIncludesVat" BOOLEAN NOT NULL DEFAULT false;

-- SubOrder: Add VAT totals (captured at order time)
ALTER TABLE "SubOrder" ADD COLUMN "netTotalCents" INTEGER;
ALTER TABLE "SubOrder" ADD COLUMN "vatTotalCents" INTEGER;
ALTER TABLE "SubOrder" ADD COLUMN "grossTotalCents" INTEGER;

-- OrderItem: Add VAT snapshot fields
ALTER TABLE "OrderItem" ADD COLUMN "taxProfileId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "vatRateBps" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "vatAmountCents" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "netCents" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "grossCents" INTEGER;

-- OrderItem: Add FK constraint to TaxProfile
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "TaxProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- OrderItem: Add index on taxProfileId
CREATE INDEX "OrderItem_taxProfileId_idx" ON "OrderItem"("taxProfileId");
