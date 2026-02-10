-- CreateEnum
CREATE TYPE "ImportTemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
-- CreateTable
CREATE TABLE "ImportTemplate" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "defaults" JSONB,
    "status" "ImportTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ImportTemplate_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "ImportTemplate_vendorId_idx" ON "ImportTemplate"("vendorId");
-- CreateIndex
CREATE INDEX "ImportTemplate_vendorId_status_idx" ON "ImportTemplate"("vendorId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "ImportTemplate_vendorId_name_key" ON "ImportTemplate"("vendorId", "name");
-- AddForeignKey
ALTER TABLE "ImportTemplate"
ADD CONSTRAINT "ImportTemplate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;