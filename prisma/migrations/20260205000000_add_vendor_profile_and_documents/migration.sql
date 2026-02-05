-- CreateEnum
CREATE TYPE "VendorDocumentType" AS ENUM (
    'CHAMBER_OF_COMMERCE_EXTRACT',
    'LEGAL_REP_ID',
    'CERTIFICATION',
    'SIGNED_CONTRACT',
    'SIGNED_GDPR_FORM',
    'OTHER'
);
-- CreateEnum
CREATE TYPE "VendorPaymentMethod" AS ENUM (
    'BANK_TRANSFER',
    'DIRECT_DEBIT',
    'CHECK',
    'OTHER'
);
-- CreateEnum
CREATE TYPE "VendorPaymentTerms" AS ENUM (
    'NET_30',
    'NET_60',
    'NET_90',
    'ON_DELIVERY',
    'PREPAID',
    'OTHER'
);
-- CreateTable
CREATE TABLE "VendorProfile" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "industry" TEXT,
    "description" TEXT,
    "foundedAt" TIMESTAMP(3),
    "employeeCount" INTEGER,
    "vatNumber" TEXT,
    "taxCode" TEXT,
    "chamberOfCommerceRegistration" TEXT,
    "registeredOfficeAddress" JSONB,
    "operatingAddress" JSONB,
    "pecEmail" TEXT,
    "sdiRecipientCode" TEXT,
    "taxRegime" TEXT,
    "licenses" TEXT,
    "adminContact" JSONB NOT NULL,
    "commercialContact" JSONB NOT NULL,
    "technicalContact" JSONB,
    "bankAccountHolder" TEXT,
    "iban" TEXT,
    "bankNameAndBranch" TEXT,
    "preferredPaymentMethod" "VendorPaymentMethod",
    "paymentTerms" "VendorPaymentTerms",
    "invoicingNotes" TEXT,
    "openingHours" TEXT,
    "closingDays" TEXT,
    "warehouseAccess" TEXT,
    "emergencyContacts" JSONB,
    "operationalNotes" TEXT,
    "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessingTimestamp" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingTimestamp" TIMESTAMP(3),
    "logoUsageConsent" BOOLEAN NOT NULL DEFAULT false,
    "logoUsageTimestamp" TIMESTAMP(3),
    "consentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "type" "VendorDocumentType" NOT NULL,
    "label" TEXT NOT NULL,
    "fileName" TEXT,
    "notes" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_vendorId_key" ON "VendorProfile"("vendorId");
-- CreateIndex
CREATE INDEX "VendorProfile_vendorId_idx" ON "VendorProfile"("vendorId");
-- CreateIndex
CREATE INDEX "VendorDocument_vendorProfileId_idx" ON "VendorDocument"("vendorProfileId");
-- CreateIndex
CREATE INDEX "VendorDocument_vendorProfileId_type_idx" ON "VendorDocument"("vendorProfileId", "type");
-- AddForeignKey
ALTER TABLE "VendorProfile"
ADD CONSTRAINT "VendorProfile_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "VendorDocument"
ADD CONSTRAINT "VendorDocument_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;