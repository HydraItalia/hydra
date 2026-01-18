-- N1.1: Add TaxProfile model and category/product tax profile fields
-- This migration is additive and backward compatible
-- Create TaxProfile table
CREATE TABLE IF NOT EXISTS "TaxProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vatRateBps" INTEGER NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaxProfile_pkey" PRIMARY KEY ("id")
);
-- Create unique index on TaxProfile.name
CREATE UNIQUE INDEX IF NOT EXISTS "TaxProfile_name_key" ON "TaxProfile"("name");
-- Create index on TaxProfile.vatRateBps
CREATE INDEX IF NOT EXISTS "TaxProfile_vatRateBps_idx" ON "TaxProfile"("vatRateBps");
-- Add parentId to ProductCategory (self-reference for subcategories)
ALTER TABLE "ProductCategory"
ADD COLUMN IF NOT EXISTS "parentId" TEXT;
-- Add taxProfileId to ProductCategory
ALTER TABLE "ProductCategory"
ADD COLUMN IF NOT EXISTS "taxProfileId" TEXT;
-- Add taxProfileId to Product
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "taxProfileId" TEXT;
-- Add foreign key from ProductCategory.parentId to ProductCategory.id
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'ProductCategory_parentId_fkey'
) THEN
ALTER TABLE "ProductCategory"
ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProductCategory"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
END IF;
END $$;
-- Add foreign key from ProductCategory.taxProfileId to TaxProfile.id
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'ProductCategory_taxProfileId_fkey'
) THEN
ALTER TABLE "ProductCategory"
ADD CONSTRAINT "ProductCategory_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "TaxProfile"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
END IF;
END $$;
-- Add foreign key from Product.taxProfileId to TaxProfile.id
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Product_taxProfileId_fkey'
) THEN
ALTER TABLE "Product"
ADD CONSTRAINT "Product_taxProfileId_fkey" FOREIGN KEY ("taxProfileId") REFERENCES "TaxProfile"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
END IF;
END $$;
-- Create indexes
CREATE INDEX IF NOT EXISTS "ProductCategory_parentId_idx" ON "ProductCategory"("parentId");
CREATE INDEX IF NOT EXISTS "ProductCategory_taxProfileId_idx" ON "ProductCategory"("taxProfileId");
CREATE INDEX IF NOT EXISTS "Product_taxProfileId_idx" ON "Product"("taxProfileId");