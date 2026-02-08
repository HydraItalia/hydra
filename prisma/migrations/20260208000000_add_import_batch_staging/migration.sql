-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM (
    'DRAFT',
    'PARSING',
    'PARSED',
    'VALIDATING',
    'VALIDATED',
    'COMMITTING',
    'COMMITTED',
    'FAILED'
);
-- CreateEnum
CREATE TYPE "ImportBatchRowStatus" AS ENUM (
    'PENDING',
    'VALID',
    'ERROR',
    'SKIPPED',
    'COMMITTED'
);
-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('TEXT', 'FILE');
-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceType" "ImportSourceType" NOT NULL DEFAULT 'TEXT',
    "originalFilename" TEXT,
    "fileUrl" TEXT,
    "parseError" TEXT,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedByUserId" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "ImportBatchRow" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "normalizedData" JSONB,
    "errors" JSONB,
    "status" "ImportBatchRowStatus" NOT NULL DEFAULT 'PENDING',
    "productId" TEXT,
    "vendorProductId" TEXT,
    CONSTRAINT "ImportBatchRow_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "ImportBatch_vendorId_idx" ON "ImportBatch"("vendorId");
-- CreateIndex
CREATE INDEX "ImportBatch_createdByUserId_idx" ON "ImportBatch"("createdByUserId");
-- CreateIndex
CREATE INDEX "ImportBatch_status_idx" ON "ImportBatch"("status");
-- CreateIndex
CREATE INDEX "ImportBatchRow_batchId_idx" ON "ImportBatchRow"("batchId");
-- CreateIndex
CREATE INDEX "ImportBatchRow_batchId_status_idx" ON "ImportBatchRow"("batchId", "status");
-- AddForeignKey
ALTER TABLE "ImportBatch"
ADD CONSTRAINT "ImportBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ImportBatch"
ADD CONSTRAINT "ImportBatch_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "ImportBatchRow"
ADD CONSTRAINT "ImportBatchRow_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE
SET NULL ON UPDATE CASCADE;