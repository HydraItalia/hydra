-- CreateEnum
CREATE TYPE "DriverStopStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "fullAddress" TEXT,
ADD COLUMN     "shortAddress" TEXT;

-- AlterTable
ALTER TABLE "DriverShift" ADD COLUMN     "cashReturnedConfirmed" BOOLEAN DEFAULT false,
ADD COLUMN     "closingNotes" TEXT;

-- CreateTable
CREATE TABLE "DriverStop" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "status" "DriverStopStatus" NOT NULL DEFAULT 'PENDING',
    "cashCollectedCents" INTEGER,
    "bonCollectedCents" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverStop_shiftId_sequenceNumber_idx" ON "DriverStop"("shiftId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "DriverStop_shiftId_idx" ON "DriverStop"("shiftId");

-- CreateIndex
CREATE INDEX "DriverStop_clientId_idx" ON "DriverStop"("clientId");

-- CreateIndex
CREATE INDEX "DriverShift_date_idx" ON "DriverShift"("date");

-- AddForeignKey
ALTER TABLE "DriverStop" ADD CONSTRAINT "DriverStop_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "DriverShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStop" ADD CONSTRAINT "DriverStop_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
