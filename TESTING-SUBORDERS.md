# SubOrder Testing Guide

Complete guide to test the SubOrder functionality manually and verify everything works.

## 🎯 What We're Testing

1. ✅ Database schema changes are applied
2. ✅ Orders automatically split into SubOrders by vendor
3. ✅ SubOrder status transitions work
4. ✅ Deliveries assign to SubOrders (not Orders)
5. ✅ Multiple vendors can have separate deliveries

---

## 📋 Testing Checklist

### Phase 1: Database Verification (2 minutes)

#### Using Prisma Studio

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   Opens at http://localhost:5555

2. **Verify Schema:**
   - [ ] `SubOrder` table exists
   - [ ] `SubOrder` has these fields:
     - `id`, `orderId`, `vendorId`
     - `status` (enum: PENDING, SUBMITTED, CONFIRMED, FULFILLING, READY, CANCELED)
     - `subOrderNumber` (unique)
     - `subTotalCents`
     - `confirmedAt`, `readyAt`, `canceledAt` (nullable dates)
     - `stripeChargeId`, `paidAt`, `paymentStatus` (for future use)
     - `vendorNotes`, `internalNotes`

   - [ ] `OrderItem` has `subOrderId` field (nullable)
   - [ ] `Delivery` has `subOrderId` field (nullable)
   - [ ] `PaymentStatus` enum exists

3. **Check Indexes:**
   Run in database:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'SubOrder';
   ```
   Should show indexes on: `orderId`, `vendorId`, `status`, `vendorId_status`

---

### Phase 2: Order Creation Test (5 minutes)

This tests that orders automatically split into SubOrders.

#### Setup:
1. Sign in as **CLIENT** role (demo mode)
2. Navigate to `/dashboard/catalog`

#### Test Steps:

**Test 2A: Single Vendor Order**
- [ ] Add 2-3 items from **ONE vendor** to cart
- [ ] Go to Cart → Submit Order
- [ ] Open Prisma Studio → Check `Order` table
- [ ] Verify: 1 Order created
- [ ] Check `SubOrder` table
- [ ] **Expected:** 1 SubOrder created
- [ ] **Expected:** SubOrder number format: `HYD-YYYYMMDD-XXXX-V01`
- [ ] **Expected:** `SubOrder.subTotalCents` = `Order.totalCents`

**Test 2B: Multi-Vendor Order** ⭐ CRITICAL TEST
- [ ] Clear cart
- [ ] Add items from **Vendor A** (e.g., 2 items)
- [ ] Add items from **Vendor B** (e.g., 3 items)
- [ ] Add items from **Vendor C** (e.g., 1 item)
- [ ] Go to Cart → Submit Order
- [ ] Check `SubOrder` table in Prisma Studio
- [ ] **Expected:** 3 SubOrders created (one per vendor)
- [ ] **Expected:** SubOrder numbers:
   - `HYD-YYYYMMDD-XXXX-V01` (Vendor A)
   - `HYD-YYYYMMDD-XXXX-V02` (Vendor B)
   - `HYD-YYYYMMDD-XXXX-V03` (Vendor C)
- [ ] **Expected:** SUM of `SubOrder.subTotalCents` = `Order.totalCents`

**Test 2C: Verify OrderItems Link**
- [ ] In Prisma Studio, check `OrderItem` table for the order
- [ ] **Expected:** Each OrderItem has `subOrderId` set
- [ ] **Expected:** Items grouped by vendor have same `subOrderId`

---

### Phase 3: Vendor Dashboard Test (5 minutes)

Tests that vendors see only their SubOrders.

#### Setup:
1. Sign in as **VENDOR** role (demo mode)
2. Navigate to `/dashboard/vendor/orders` (or wherever vendor orders are shown)

#### Test Steps:

- [ ] Vendor sees list of SubOrders (not full Orders)
- [ ] Each SubOrder shows:
  - [ ] SubOrder number (e.g., `HYD-20260103-1234-V01`)
  - [ ] Status (PENDING, SUBMITTED, etc.)
  - [ ] Items for ONLY their vendor (not other vendors' items)
  - [ ] Subtotal for their items only

- [ ] Click on a SubOrder detail
- [ ] Verify: Only shows items from this vendor
- [ ] Verify: Shows parent Order number for reference

---

### Phase 4: SubOrder Status Transitions (5 minutes)

Tests the state machine and status updates.

#### Using Prisma Studio (Direct DB):

1. **Find a SubOrder with status = SUBMITTED**
2. **Test Valid Transitions:**
   - [ ] Change status to `CONFIRMED` → Save
   - [ ] **Expected:** `confirmedAt` timestamp is set
   - [ ] Change status to `FULFILLING` → Save
   - [ ] **Expected:** Works
   - [ ] Change status to `READY` → Save
   - [ ] **Expected:** `readyAt` timestamp is set

3. **Check Parent Order Status:**
   - [ ] Find the parent `Order` (via `orderId`)
   - [ ] **Expected:** Order status updated based on SubOrder states:
     - If all SubOrders are READY → Order is CONFIRMED
     - If any SubOrder is CONFIRMED/FULFILLING/READY → Order is CONFIRMED
     - If all SubOrders are CANCELED → Order is CANCELED

#### Using Vendor UI (if implemented):
- [ ] Vendor can update their SubOrder status
- [ ] Invalid transitions are blocked (e.g., READY → PENDING)
- [ ] Parent Order status updates automatically

---

### Phase 5: Delivery Assignment Test (5 minutes)

Tests that deliveries assign to SubOrders (not Orders).

#### Using Prisma Studio:

1. **Find a SubOrder with status = READY**
2. **Find or create a Driver** (status = ONLINE)
3. **Create a Delivery:**
   - [ ] In `Delivery` table → Add Record
   - [ ] Set `subOrderId` = (the READY SubOrder's ID)
   - [ ] Set `orderId` = `null` (leave empty)
   - [ ] Set `driverId` = (your driver's ID)
   - [ ] Set `status` = `ASSIGNED`
   - [ ] Set `routeSequence` = `0` ⚠️ Important: Use 0 to test nullish coalescing
   - [ ] Save

4. **Verify:**
   - [ ] Delivery created successfully
   - [ ] `routeSequence` is `0` (NOT null) ✅ Tests our nullish coalescing fix
   - [ ] `subOrderId` is set
   - [ ] `orderId` is null

#### Using Admin UI (if implemented):
- [ ] Admin can assign driver to a SubOrder
- [ ] Multiple SubOrders from same Order can have different drivers
- [ ] Driver assignment only works for READY SubOrders

---

### Phase 6: Multi-Vendor Delivery Test (10 minutes) ⭐

Tests the core feature: different vendors get different deliveries.

#### Setup:
Create an Order with 3 vendors (following Test 2B above)

#### Test Steps:

1. **Update all 3 SubOrders to READY status:**
   - [ ] SubOrder V01 → READY
   - [ ] SubOrder V02 → READY
   - [ ] SubOrder V03 → READY

2. **Assign different drivers to each:**
   - [ ] Create Delivery for SubOrder V01 → Driver A
   - [ ] Create Delivery for SubOrder V02 → Driver B
   - [ ] Create Delivery for SubOrder V03 → Driver C

3. **Verify in Prisma Studio:**
   - [ ] 3 separate `Delivery` records exist
   - [ ] Each links to different `subOrderId`
   - [ ] Each has different `driverId`
   - [ ] All have `orderId` = null (new system)

4. **This proves:**
   ✅ One Order can have multiple deliveries (one per vendor)
   ✅ Each vendor's items are delivered independently

---

### Phase 7: Transaction Safety Test (Advanced)

Tests that status updates are atomic.

#### Manual Test:

1. **Find a SubOrder in SUBMITTED status**
2. **Simulate a failed transaction:**
   - Temporarily break the database connection
   - Try to update SubOrder status via API
   - **Expected:** Both SubOrder status AND parent Order status should either:
     - Both update successfully, OR
     - Both remain unchanged (rollback)
   - Never: SubOrder updated but Order unchanged

---

## 🐛 Common Issues & Fixes

### Issue: "SubOrder table does not exist"
**Fix:** Run migration:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Issue: No SubOrders created when submitting order
**Fix:** Check `src/data/order.ts` - `createOrderFromCart()` should group items by vendor

### Issue: routeSequence = null when set to 0
**Fix:** Check `admin-deliveries.ts` line 113 - should use `??` not `||`

### Issue: SubOrder status updates but Order status doesn't
**Fix:** Check transaction in `vendor-suborders.ts` - should use `$transaction`

### Issue: Can't assign delivery to SubOrder
**Fix:** Ensure SubOrder status is READY, not CONFIRMED

---

## 📊 Success Criteria

Your implementation is working correctly if:

✅ **Schema:**
- [x] SubOrder table exists with all required fields
- [x] Enums (SubOrderStatus, PaymentStatus) exist
- [x] Foreign keys and indexes are in place

✅ **Order Creation:**
- [x] Single-vendor orders create 1 SubOrder
- [x] Multi-vendor orders create N SubOrders (one per vendor)
- [x] SubOrder numbers follow pattern: `HYD-YYYYMMDD-XXXX-V##`
- [x] Order.totalCents = SUM(SubOrder.subTotalCents)

✅ **Status Management:**
- [x] SubOrder state transitions are validated
- [x] Parent Order status derives from SubOrder statuses
- [x] Timestamp fields (confirmedAt, readyAt) are set automatically
- [x] Updates are atomic (both or neither)

✅ **Delivery System:**
- [x] Deliveries link to SubOrders (not Orders)
- [x] Multiple SubOrders can have different drivers
- [x] routeSequence = 0 is preserved (not converted to null)

✅ **Vendor Isolation:**
- [x] Vendors see only their own SubOrders
- [x] Vendor can't access other vendors' SubOrders
- [x] Each vendor manages their own workflow independently

---

## 🚀 Quick Smoke Test (2 minutes)

If you just want to verify the basics work:

```bash
# 1. Check schema
npx prisma studio
# Look for SubOrder table ✓

# 2. Create multi-vendor order via UI
# - Sign in as CLIENT
# - Add items from 2+ vendors
# - Submit order

# 3. Check in Prisma Studio
# - Orders table: 1 new order
# - SubOrder table: 2+ new suborders
# - OrderItem table: items have subOrderId set

# 4. Test delivery
# - Update one SubOrder to READY
# - Create Delivery with subOrderId set
# - Verify routeSequence = 0 works
```

If all 4 steps work → ✅ **Core functionality is operational!**

---

## 📝 Reporting Issues

If you find bugs, check:
1. Browser console for errors
2. Server logs (where Next.js is running)
3. Prisma Studio → verify data structure
4. Database directly (for schema issues)

Report with:
- Which test failed
- Expected vs Actual behavior
- Error messages (if any)
- Screenshots from Prisma Studio
