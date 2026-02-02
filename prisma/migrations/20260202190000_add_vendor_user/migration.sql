-- CreateEnum
CREATE TYPE "VendorUserRole" AS ENUM ('OWNER', 'STAFF', 'AGENT');

-- CreateTable
CREATE TABLE "VendorUser" (
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "VendorUserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorUser_pkey" PRIMARY KEY ("vendorId","userId")
);

-- CreateIndex
CREATE INDEX "VendorUser_vendorId_idx" ON "VendorUser"("vendorId");

-- CreateIndex
CREATE INDEX "VendorUser_userId_idx" ON "VendorUser"("userId");

-- AddForeignKey
ALTER TABLE "VendorUser" ADD CONSTRAINT "VendorUser_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorUser" ADD CONSTRAINT "VendorUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
