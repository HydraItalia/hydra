# Phase 7.2 Database Migration Guide

## Overview

This guide explains how to apply the Phase 7.2 database schema changes to support optimized route planning.

## Schema Changes

### Order Model
Added three optional fields for delivery location:
- `deliveryLat` (Float?) - Latitude coordinate
- `deliveryLng` (Float?) - Longitude coordinate
- `deliveryAddress` (String?) - Full text address

### Delivery Model
Added one optional field for route optimization:
- `routeSequence` (Int?) - Optimized stop position (1, 2, 3, ...)
- New composite index on `[driverId, routeSequence]`

## Migration Commands

### Development (Quick Push)
```bash
# Push schema changes directly to database (no migration file)
npm run db:push
# or
npx prisma db push
```

### Production (Create Migration)
```bash
# Create and apply migration
npm run db:migrate
# or
npx prisma migrate dev --name add_route_planning_fields

# For production deployment
npx prisma migrate deploy
```

## Post-Migration Steps

### 1. Regenerate Prisma Client
The migration will automatically regenerate the Prisma client. If needed, manually run:
```bash
npx prisma generate
```

### 2. Verify TypeScript Types
After migration, the TypeScript errors in `src/lib/route-calculator.ts` should disappear. The type assertions marked with `as any` and `as unknown` are temporary workarounds that can be removed once Prisma regenerates types.

### 3. Populate Delivery Coordinates (Optional)
If you have existing orders that need delivery coordinates, you'll need to populate them. Here's a sample script:

```typescript
// scripts/populate-delivery-coords.ts
import { prisma } from '../src/lib/prisma';

async function populateCoordinates() {
  const orders = await prisma.order.findMany({
    where: {
      deliveryLat: null,
      // Only update orders that have deliveries
      delivery: {
        isNot: null,
      },
    },
    include: {
      client: true,
    },
  });

  for (const order of orders) {
    // Example: Set coordinates for Cagliari region
    // In production, you'd geocode the actual client address
    await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryLat: 39.2238 + (Math.random() - 0.5) * 0.1,
        deliveryLng: 9.1217 + (Math.random() - 0.5) * 0.1,
        deliveryAddress: `Via Example ${order.client.name}, Cagliari, Italy`,
      },
    });
  }

  console.log(`Updated ${orders.length} orders with delivery coordinates`);
}

populateCoordinates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx tsx scripts/populate-delivery-coords.ts
```

## Rollback (If Needed)

If you need to rollback the migration:

### Development
```bash
# Reset database and re-run all migrations except the last one
npm run db:reset
```

### Production
```bash
# Manually remove the migration from prisma/migrations/
# Then apply a down migration (requires manual SQL)
```

**Rollback SQL (manual):**
```sql
-- Remove route planning fields from Delivery
ALTER TABLE "Delivery" DROP COLUMN IF EXISTS "routeSequence";

-- Remove route planning fields from Order
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryLat";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryLng";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "deliveryAddress";

-- Remove index
DROP INDEX IF EXISTS "Delivery_driverId_routeSequence_idx";
```

## Data Validation

After migration, verify the schema:

```bash
# Open Prisma Studio to inspect the database
npm run db:studio
```

Check:
1. Order table has new columns: deliveryLat, deliveryLng, deliveryAddress
2. Delivery table has new column: routeSequence
3. All existing data is intact
4. New fields are nullable (NULL for existing records)

## Testing

### Manual Test
1. Create a new order with delivery coordinates
2. Create a delivery for that order
3. Visit `/dashboard/route` as a driver
4. Verify route calculation works

### Automated Test
```typescript
// Test that new fields are accessible
const order = await prisma.order.create({
  data: {
    // ... existing fields
    deliveryLat: 39.2238,
    deliveryLng: 9.1217,
    deliveryAddress: '123 Test St, Cagliari',
  },
});

expect(order.deliveryLat).toBe(39.2238);
```

## Environment Setup

Don't forget to add your Google Maps API key:

```bash
# .env.local
GOOGLE_MAPS_API_KEY="your_api_key_here"
```

## Troubleshooting

### "Property does not exist" TypeScript errors
- Run `npx prisma generate` to regenerate types
- Restart your TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

### Migration fails
- Check that your database is accessible
- Verify DATABASE_URL in .env.local
- Ensure no other processes are using the database

### Prisma Client out of sync
```bash
# Force regenerate
npx prisma generate --force
```

## Next Steps

After migration:
1. Configure Google Maps API key
2. Test route calculation with sample data
3. Update order creation forms to capture delivery addresses
4. Consider geocoding service for address → coordinates conversion

See `docs/PHASE_7.2_IMPLEMENTATION_NOTES.md` for full feature documentation.
