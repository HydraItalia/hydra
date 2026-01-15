-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_stripeAccountId_key" ON "Vendor"("stripeAccountId");
