-- CreateTable
CREATE TABLE "VendorCategoryMapping" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "rawCategory" TEXT NOT NULL,
    "canonicalSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorCategoryMapping_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "VendorCategoryMapping_vendorId_rawCategory_key" ON "VendorCategoryMapping"("vendorId", "rawCategory");
-- CreateIndex
CREATE INDEX "VendorCategoryMapping_vendorId_idx" ON "VendorCategoryMapping"("vendorId");
-- CreateIndex
CREATE INDEX "VendorCategoryMapping_canonicalSlug_idx" ON "VendorCategoryMapping"("canonicalSlug");
-- AddForeignKey
ALTER TABLE "VendorCategoryMapping"
ADD CONSTRAINT "VendorCategoryMapping_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;