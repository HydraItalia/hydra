-- CreateEnum
CREATE TYPE "ClientVendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
-- CreateTable
CREATE TABLE "ClientVendor" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "ClientVendorStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    CONSTRAINT "ClientVendor_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "ClientVendor_clientId_idx" ON "ClientVendor"("clientId");
-- CreateIndex
CREATE INDEX "ClientVendor_vendorId_idx" ON "ClientVendor"("vendorId");
-- CreateIndex
CREATE INDEX "ClientVendor_status_idx" ON "ClientVendor"("status");
-- CreateIndex
CREATE UNIQUE INDEX "ClientVendor_clientId_vendorId_key" ON "ClientVendor"("clientId", "vendorId");
-- AddForeignKey
ALTER TABLE "ClientVendor"
ADD CONSTRAINT "ClientVendor_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClientVendor"
ADD CONSTRAINT "ClientVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ClientVendor"
ADD CONSTRAINT "ClientVendor_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;