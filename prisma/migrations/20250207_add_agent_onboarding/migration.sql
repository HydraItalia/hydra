-- Migration: 20250207_add_agent_onboarding
-- Phase 1: Agent Onboarding Database Schema
-- Additive only, no destructive changes

-- ══════════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ══════════════════════════════════════════════════════════════════════════════

-- Agent type (exclusive vs non-exclusive)
CREATE TYPE "AgentType" AS ENUM ('MONOMANDATARIO', 'PLURIMANDATARIO');

-- Agent status (onboarding workflow)
CREATE TYPE "AgentStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'REJECTED'
);

-- Agent document types
CREATE TYPE "AgentDocumentType" AS ENUM (
  'ID_DOCUMENT',
  'TAX_CODE_CARD',
  'CHAMBER_OF_COMMERCE_EXTRACT',
  'ENASARCO_CERTIFICATE',
  'SIGNED_GDPR_FORM',
  'OTHER'
);

-- Agent payment method
CREATE TYPE "AgentPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CHECK', 'OTHER');

-- ══════════════════════════════════════════════════════════════════════════════
-- AGENT (Core Entity)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "Agent" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  -- Legacy-compat fields (denormalized from profile)
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "email" TEXT,

  -- Unique identifiers
  "taxCode" TEXT NOT NULL,
  "agentCode" TEXT,

  -- Onboarding workflow
  "status" "AgentStatus" NOT NULL DEFAULT 'PENDING',
  "approvedAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "suspendedReason" TEXT,

  CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agent_taxCode_key" ON "Agent"("taxCode");
CREATE UNIQUE INDEX "Agent_agentCode_key" ON "Agent"("agentCode");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- ══════════════════════════════════════════════════════════════════════════════
-- AGENT PROFILE (1:1 with Agent, source of truth for onboarding data)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "AgentProfile" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  -- Section 1: Dati Anagrafici
  "fullName" TEXT NOT NULL,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "birthPlace" TEXT NOT NULL,
  "nationality" TEXT NOT NULL DEFAULT 'Italiana',
  "residentialAddress" JSONB NOT NULL,
  "domicileAddress" JSONB,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "pecEmail" TEXT,

  -- Section 2: Dati Professionali
  "agentType" "AgentType" NOT NULL,
  "chamberRegistrationNumber" TEXT NOT NULL,
  "chamberRegistrationDate" TIMESTAMP(3) NOT NULL,
  "chamberName" TEXT NOT NULL,
  "professionalAssociations" TEXT,
  "coveredTerritories" TEXT[] NOT NULL,
  "sectors" TEXT[] NOT NULL,

  -- Section 3: Dati Fiscali
  "vatNumber" TEXT NOT NULL,
  "taxRegime" TEXT NOT NULL,
  "atecoCode" TEXT NOT NULL,
  "sdiRecipientCode" TEXT NOT NULL,
  "invoicingPecEmail" TEXT NOT NULL,
  "enasarcoNumber" TEXT NOT NULL,
  "enasarcoRegistrationDate" TIMESTAMP(3) NOT NULL,

  -- Section 4: Dati Bancari
  "bankAccountHolder" TEXT NOT NULL,
  "iban" TEXT NOT NULL,
  "bankNameBranch" TEXT NOT NULL,
  "preferredPaymentMethod" "AgentPaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
  "commissionNotes" TEXT,

  -- Section 5: Consents
  "dataProcessingConsent" BOOLEAN NOT NULL DEFAULT false,
  "dataProcessingTimestamp" TIMESTAMP(3),
  "operationalCommsConsent" BOOLEAN NOT NULL DEFAULT false,
  "operationalCommsTimestamp" TIMESTAMP(3),
  "commercialImageConsent" BOOLEAN NOT NULL DEFAULT false,
  "commercialImageTimestamp" TIMESTAMP(3),
  "consentVersion" TEXT NOT NULL DEFAULT '1.0',

  "notes" TEXT,

  CONSTRAINT "AgentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentProfile_agentId_key" ON "AgentProfile"("agentId");

ALTER TABLE "AgentProfile"
  ADD CONSTRAINT "AgentProfile_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- AGENT DOCUMENT (upload-ready metadata)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE "AgentDocument" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  -- Metadata
  "type" "AgentDocumentType" NOT NULL,
  "label" TEXT NOT NULL,
  "fileName" TEXT,
  "notes" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,

  -- File storage (nullable until upload implemented)
  "storageKey" TEXT,
  "storageProvider" TEXT,
  "fileUrl" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "uploadedAt" TIMESTAMP(3),

  -- Verification
  "expiryDate" TIMESTAMP(3),
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,

  CONSTRAINT "AgentDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentDocument_agentId_idx" ON "AgentDocument"("agentId");
CREATE INDEX "AgentDocument_type_idx" ON "AgentDocument"("type");

ALTER TABLE "AgentDocument"
  ADD CONSTRAINT "AgentDocument_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ══════════════════════════════════════════════════════════════════════════════
-- USER TABLE UPDATE (add agentId foreign key)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE "User" ADD COLUMN "agentId" TEXT;

CREATE UNIQUE INDEX "User_agentId_key" ON "User"("agentId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_agentId_fkey"
  FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
