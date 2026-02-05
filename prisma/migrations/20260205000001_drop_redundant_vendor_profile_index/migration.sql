-- DropIndex (redundant: unique index on vendorId already provides B-tree lookup)
DROP INDEX IF EXISTS "VendorProfile_vendorId_idx";