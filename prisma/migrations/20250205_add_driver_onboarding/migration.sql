-- Migration: 20250205_add_driver_onboarding
-- Additive only - no destructive changes
-- Extends existing Driver model with onboarding support
-- ============ ENUMS ============
CREATE TYPE "DriverOnboardingStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'REJECTED'
);
CREATE TYPE "DriverIdDocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVING_LICENSE');
CREATE TYPE "DriverDocumentType" AS ENUM (
  'ID_DOCUMENT',
  'DRIVING_LICENSE',
  'SIGNED_GDPR_FORM',
  'ADR_CERTIFICATE',
  'CQC_CERTIFICATE',
  'MEDICAL_CERTIFICATE',
  'CRIMINAL_RECORD',
  'OTHER'
);
CREATE TYPE "CompanyType" AS ENUM ('VENDOR', 'LOGISTICS_PARTNER');
CREATE TYPE "DriverCompanyLinkStatus" AS ENUM (
  'PENDING',
  'ACTIVE',
  'INACTIVE',
  'REJECTED'
);
-- ============ ALTER EXISTING DRIVER TABLE ============
-- Add onboarding fields to existing Driver table
ALTER TABLE "Driver"
ADD COLUMN "taxCode" TEXT;
ALTER TABLE "Driver"
ADD COLUMN "onboardingStatus" "DriverOnboardingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Driver"
ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Driver"
ADD COLUMN "activatedAt" TIMESTAMP(3);
ALTER TABLE "Driver"
ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "Driver"
ADD COLUMN "suspendedReason" TEXT;
-- Add unique constraint on taxCode (allows NULL for existing drivers)
CREATE UNIQUE INDEX "Driver_taxCode_key" ON "Driver"("taxCode");
-- Add index for onboarding status queries
CREATE INDEX "Driver_onboardingStatus_idx" ON "Driver"("onboardingStatus");
-- ============ NEW TABLES ============
-- DriverProfile
CREATE TABLE "DriverProfile" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "fullName" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "birthPlace" TEXT NOT NULL,
  "nationality" TEXT NOT NULL DEFAULT 'Italiana',
  "residentialAddress" JSONB NOT NULL,
  "domicileAddress" JSONB,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "pecEmail" TEXT,
  "idDocumentType" "DriverIdDocumentType" NOT NULL,
  "idDocumentNumber" TEXT NOT NULL,
  "idDocumentExpiry" TIMESTAMP(3) NOT NULL,
  "idDocumentIssuer" TEXT NOT NULL,
  "currentVendorId" TEXT,
  "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
  "dataProcessingTimestamp" TIMESTAMP(3),
  "operationalCommsConsent" BOOLEAN NOT NULL DEFAULT false,
  "operationalCommsTimestamp" TIMESTAMP(3),
  "geolocationConsent" BOOLEAN NOT NULL DEFAULT false,
  "geolocationTimestamp" TIMESTAMP(3),
  "imageUsageConsent" BOOLEAN NOT NULL DEFAULT false,
  "imageUsageTimestamp" TIMESTAMP(3),
  "consentVersion" TEXT NOT NULL DEFAULT '1.0',
  "notes" TEXT,
  CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverProfile_driverId_key" ON "DriverProfile"("driverId");
ALTER TABLE "DriverProfile"
ADD CONSTRAINT "DriverProfile_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- DriverLicense
CREATE TABLE "DriverLicense" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "licenseType" TEXT NOT NULL,
  "licenseNumber" TEXT NOT NULL,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "expiryDate" TIMESTAMP(3) NOT NULL,
  "issuingAuthority" TEXT NOT NULL,
  "isCertification" BOOLEAN NOT NULL DEFAULT false,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "documentId" TEXT,
  CONSTRAINT "DriverLicense_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverLicense_documentId_key" ON "DriverLicense"("documentId");
CREATE INDEX "DriverLicense_driverId_idx" ON "DriverLicense"("driverId");
CREATE INDEX "DriverLicense_expiryDate_idx" ON "DriverLicense"("expiryDate");
ALTER TABLE "DriverLicense"
ADD CONSTRAINT "DriverLicense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- DriverDocument
CREATE TABLE "DriverDocument" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "type" "DriverDocumentType" NOT NULL,
  "label" TEXT NOT NULL,
  "fileName" TEXT,
  "notes" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "storageKey" TEXT,
  "storageProvider" TEXT,
  "fileUrl" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "uploadedAt" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  CONSTRAINT "DriverDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DriverDocument_driverId_idx" ON "DriverDocument"("driverId");
CREATE INDEX "DriverDocument_type_idx" ON "DriverDocument"("type");
ALTER TABLE "DriverDocument"
ADD CONSTRAINT "DriverDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- DriverLicense -> DriverDocument FK (deferred to avoid circular)
ALTER TABLE "DriverLicense"
ADD CONSTRAINT "DriverLicense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DriverDocument"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- DriverCompanyLink
CREATE TABLE "DriverCompanyLink" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "companyType" "CompanyType" NOT NULL,
  "vendorId" TEXT,
  "status" "DriverCompanyLinkStatus" NOT NULL DEFAULT 'PENDING',
  "role" TEXT,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activatedAt" TIMESTAMP(3),
  "deactivatedAt" TIMESTAMP(3),
  "deactivatedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriverCompanyLink_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DriverCompanyLink_driverId_idx" ON "DriverCompanyLink"("driverId");
CREATE INDEX "DriverCompanyLink_vendorId_idx" ON "DriverCompanyLink"("vendorId");
CREATE INDEX "DriverCompanyLink_status_idx" ON "DriverCompanyLink"("status");
ALTER TABLE "DriverCompanyLink"
ADD CONSTRAINT "DriverCompanyLink_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DriverCompanyLink"
ADD CONSTRAINT "DriverCompanyLink_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- PARTIAL UNIQUE INDEXES (Prisma can't express these)
-- Only one ACTIVE link per driver
CREATE UNIQUE INDEX "DriverCompanyLink_driverId_active_unique" ON "DriverCompanyLink" ("driverId")
WHERE status = 'ACTIVE';
-- Only one PENDING link per driver
CREATE UNIQUE INDEX "DriverCompanyLink_driverId_pending_unique" ON "DriverCompanyLink" ("driverId")
WHERE status = 'PENDING';
-- DriverInvite
CREATE TABLE "DriverInvite" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "vendorId" TEXT NOT NULL,
  "invitedByUserId" TEXT,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "consumedByDriverId" TEXT,
  CONSTRAINT "DriverInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DriverInvite_token_key" ON "DriverInvite"("token");
CREATE INDEX "DriverInvite_vendorId_idx" ON "DriverInvite"("vendorId");
CREATE INDEX "DriverInvite_expiresAt_idx" ON "DriverInvite"("expiresAt");
ALTER TABLE "DriverInvite"
ADD CONSTRAINT "DriverInvite_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Optional FK for consumedByDriverId (clean audit trail)
ALTER TABLE "DriverInvite"
ADD CONSTRAINT "DriverInvite_consumedByDriverId_fkey" FOREIGN KEY ("consumedByDriverId") REFERENCES "Driver"("id") ON DELETE
SET NULL ON UPDATE CASCADE;