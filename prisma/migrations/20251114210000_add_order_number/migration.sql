-- AlterTable
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;

-- Update existing orders with generated order numbers
DO $$
DECLARE
  order_record RECORD;
  order_date TEXT;
  sequence_num INTEGER := 1;
BEGIN
  FOR order_record IN
    SELECT id, "createdAt"
    FROM "Order"
    WHERE "orderNumber" IS NULL
    ORDER BY "createdAt" ASC
  LOOP
    -- Format: HYD-YYYYMMDD-NNNN
    order_date := TO_CHAR(order_record."createdAt", 'YYYYMMDD');
    UPDATE "Order"
    SET "orderNumber" = 'HYD-' || order_date || '-' || LPAD(sequence_num::TEXT, 4, '0')
    WHERE id = order_record.id;
    sequence_num := sequence_num + 1;
  END LOOP;
END $$;

-- Make column required and add unique constraint
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
