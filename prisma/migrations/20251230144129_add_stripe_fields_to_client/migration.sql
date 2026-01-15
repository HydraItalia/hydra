-- AlterTable
ALTER TABLE "Client" ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "defaultPaymentMethodId" TEXT,
ADD COLUMN "hasPaymentMethod" BOOLEAN NOT NULL DEFAULT false;
