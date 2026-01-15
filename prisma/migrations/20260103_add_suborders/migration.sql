-- CreateEnum: SubOrderStatus
CREATE TYPE "SubOrderStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FULFILLING', 'READY', 'CANCELED');

-- CreateEnum: PaymentStatus
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable: SubOrder
CREATE TABLE "SubOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "SubOrderStatus" NOT NULL DEFAULT 'PENDING',
    "subOrderNumber" TEXT NOT NULL,
    "subTotalCents" INTEGER NOT NULL,
    "stripeChargeId" TEXT,
    "paidAt" TIMESTAMP(3),
    "paymentStatus" "PaymentStatus",
    "confirmedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "vendorNotes" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubOrder_subOrderNumber_key" ON "SubOrder"("subOrderNumber");
CREATE INDEX "SubOrder_orderId_idx" ON "SubOrder"("orderId");
CREATE INDEX "SubOrder_vendorId_idx" ON "SubOrder"("vendorId");
CREATE INDEX "SubOrder_status_idx" ON "SubOrder"("status");
CREATE INDEX "SubOrder_vendorId_status_idx" ON "SubOrder"("vendorId", "status");

-- AlterTable: OrderItem - Add subOrderId column (nullable for backward compatibility)
ALTER TABLE "OrderItem" ADD COLUMN "subOrderId" TEXT;

-- CreateIndex on OrderItem.subOrderId
CREATE INDEX "OrderItem_subOrderId_idx" ON "OrderItem"("subOrderId");

-- AlterTable: Delivery - Add subOrderId and make orderId nullable
-- Step 1: Add subOrderId column (nullable)
ALTER TABLE "Delivery" ADD COLUMN "subOrderId" TEXT;

-- Step 2: Drop the unique index on orderId
DROP INDEX "Delivery_orderId_key";

-- Step 3: Make orderId nullable
ALTER TABLE "Delivery" ALTER COLUMN "orderId" DROP NOT NULL;

-- Step 4: Add unique constraint on subOrderId (partial index to allow nulls)
CREATE UNIQUE INDEX "Delivery_subOrderId_key" ON "Delivery"("subOrderId") WHERE "subOrderId" IS NOT NULL;

-- Step 5: Add unique constraint back on orderId (partial index for existing records)
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId") WHERE "orderId" IS NOT NULL;

-- CreateIndex on Delivery columns
CREATE INDEX "Delivery_orderId_idx" ON "Delivery"("orderId");
CREATE INDEX "Delivery_subOrderId_idx" ON "Delivery"("subOrderId");

-- AddForeignKey: SubOrder to Order
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: SubOrder to Vendor
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: OrderItem to SubOrder
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Delivery to SubOrder
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
