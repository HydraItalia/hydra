-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryLat" DOUBLE PRECISION,
ADD COLUMN     "deliveryLng" DOUBLE PRECISION,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "freezco" BOOLEAN,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastVisitAt" TIMESTAMP(3),
ADD COLUMN     "mandanti" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pinColor" TEXT,
ADD COLUMN     "taxId" TEXT;

-- CreateTable
CREATE TABLE "ClientStats" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "clientVisits" INTEGER NOT NULL DEFAULT 0,
    "phoneCalls" INTEGER NOT NULL DEFAULT 0,
    "emails" INTEGER NOT NULL DEFAULT 0,
    "other" INTEGER NOT NULL DEFAULT 0,
    "deliveryCount" INTEGER NOT NULL DEFAULT 0,
    "bankTransferCount" INTEGER NOT NULL DEFAULT 0,
    "invoiceCount" INTEGER NOT NULL DEFAULT 0,
    "collectionCount" INTEGER NOT NULL DEFAULT 0,
    "failedCollectionCount" INTEGER NOT NULL DEFAULT 0,
    "extensionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Client_externalId_key" ON "Client"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ClientStats_clientId_key" ON "ClientStats"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_region_idx" ON "Client"("region");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Client_hidden_idx" ON "Client"("hidden");

-- AddForeignKey
ALTER TABLE "ClientStats" ADD CONSTRAINT "ClientStats_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
