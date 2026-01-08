# Pre-Authorization Testing Checklist

Quick reference for testing issue #101 implementation.

## Quick Start (5 minutes)

```bash
# 1. Start Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# 2. Start dev server (in another terminal)
npm run dev

# 3. Run automated test setup
npx tsx scripts/test-pre-authorization.ts

# 4. Test via UI
# Open: http://localhost:3000/dashboard/orders
# Find your test order and change status to CONFIRMED
```

## Pre-Flight Checklist

- [ ] `.env.local` has `STRIPE_SECRET_KEY` configured
- [ ] Stripe CLI installed and authenticated
- [ ] At least one client with payment method
- [ ] At least two vendors with Stripe Connect enabled
- [ ] Dev server running on port 3000

## Test Scenarios

### ✅ Happy Path

- [ ] Create order with items from 2+ vendors
- [ ] Confirm order (SUBMITTED → CONFIRMED)
- [ ] Verify `stripeChargeId` populated for each SubOrder
- [ ] Check Stripe Dashboard shows uncaptured charges
- [ ] Verify charges are on vendor accounts (not platform)

### ❌ Error Cases

- [ ] Try confirming without client payment method → Should fail
- [ ] Try confirming without vendor Stripe Connect → Should fail
- [ ] Use declining test card (4000 0000 0000 9995) → Should fail
- [ ] Try authorizing already-authorized SubOrder → Should succeed (idempotent)
- [ ] Test timeout (reduce timeout to 1s temporarily) → Should fail gracefully

## Database Checks

```sql
-- Check SubOrder payment status
SELECT
  so.subOrderNumber,
  so.stripeChargeId,
  so.paymentStatus,
  v.name
FROM "SubOrder" so
JOIN "Vendor" v ON v.id = so.vendorId
WHERE so.orderId = 'YOUR_ORDER_ID';
```

Expected after confirmation:

- `stripeChargeId`: `pi_...` (not null)
- `paymentStatus`: `PROCESSING`

## Stripe Dashboard Checks

1. Go to: https://dashboard.stripe.com/test/payments
2. Filter by: "Uncaptured"
3. Verify:
   - [ ] Status: "Requires capture"
   - [ ] Amount matches SubOrder total
   - [ ] Customer matches client
   - [ ] Each charge on correct vendor account

## Build Verification

```bash
# TypeScript check
npx tsc --noEmit

# Build check
npm run build
```

Both should complete without errors related to new code.

## Files to Review

- [ ] `/src/lib/stripe-auth.ts` - Core authorization logic
- [ ] `/src/app/api/stripe/authorize-charge/route.ts` - API endpoint
- [ ] `/src/actions/admin-orders.ts` - Integration point
- [ ] `/docs/testing-pre-authorization.md` - Full testing guide

## Cleanup

```bash
# Cancel test PaymentIntents
stripe payment_intents list --uncaptured
stripe payment_intents cancel pi_xxx

# Or delete test orders from database
psql $DATABASE_URL -c "DELETE FROM \"Order\" WHERE orderNumber LIKE 'TEST-%';"
```

## Documentation

- Full guide: `docs/testing-pre-authorization.md`
- Test script: `scripts/test-pre-authorization.ts`
- Stripe webhook testing: `docs/stripe-webhook-testing.md`
