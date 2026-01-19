-- Add hydraFeeBps field to SubOrder (N2.1)
-- Stores the fee rate in basis points (e.g., 500 = 5.00%)
-- Nullable to maintain backward compatibility with existing SubOrders
ALTER TABLE "SubOrder"
ADD COLUMN "hydraFeeBps" INTEGER;