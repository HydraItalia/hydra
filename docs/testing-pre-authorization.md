# Testing Pre-Authorization of Vendor Charges (Issue #101)

## Overview

This guide explains how to test the vendor charge pre-authorization feature that holds funds when an order is confirmed without capturing them.

## What This Feature Does

When an admin/agent confirms an order (transitions from SUBMITTED → CONFIRMED):

1. Creates a Stripe PaymentIntent for each SubOrder with `capture_method: 'manual'`
2. Charges are created directly on vendor's Stripe Connected Account
3. Funds are held (authorized) but NOT captured
4. PaymentIntent ID stored in `SubOrder.stripeChargeId`
5. Payment status updated to track authorization state

## Prerequisites

### Required Setup

- [ ] **Stripe Test Mode Keys** configured in `.env.local`
- [ ] **Stripe CLI** installed and authenticated
- [ ] **Client with payment method** (Demo Ristorante or create new)
- [ ] **Vendor with Stripe Connect** account set up
- [ ] **Test order** in SUBMITTED status with SubOrders
- [ ] Development server running on `http://localhost:3000`

### Environment Variables

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # From stripe listen
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Testing Methods

### Method 1: Automated Test Script (Recommended)

Run the comprehensive test script:

```bash
npx tsx scripts/test-pre-authorization.ts
```

This script will:

- ✅ Create a client with Stripe customer
- ✅ Create vendors with Stripe Connect accounts
- ✅ Set up test payment method
- ✅ Create multi-vendor order
- ✅ Pre-authorize charges for each vendor
- ✅ Verify payment status and charge IDs
- ✅ Test error scenarios

---

### Method 2: Manual UI Testing

#### Step 1: Set Up Client Payment Method

1. **Navigate to client billing:**

   ```
   http://localhost:3000/dashboard/clients/[clientId]
   → Click "Billing" tab
   ```

2. **Add payment method:**

   - Click "Add Payment Method"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
   - Click "Save"

3. **Verify in database:**

   ```sql
   SELECT
     id,
     name,
     stripeCustomerId,
     defaultPaymentMethodId,
     hasPaymentMethod
   FROM "Client"
   WHERE id = 'your-client-id';
   ```

   Expected:

   - `stripeCustomerId`: `cus_...`
   - `defaultPaymentMethodId`: `pm_...`
   - `hasPaymentMethod`: `true`

#### Step 2: Set Up Vendor Stripe Connect

1. **Navigate to vendor settings:**

   ```
   http://localhost:3000/dashboard/vendors/[vendorId]
   → Click "Settings" tab
   ```

2. **Connect Stripe account:**

   - Click "Connect Stripe Account"
   - Complete onboarding flow (test mode)
   - Use test business info

3. **Verify in database:**

   ```sql
   SELECT
     id,
     name,
     stripeAccountId,
     chargesEnabled,
     payoutsEnabled
   FROM "Vendor"
   WHERE id = 'your-vendor-id';
   ```

   Expected:

   - `stripeAccountId`: `acct_...`
   - `chargesEnabled`: `true`

#### Step 3: Create Test Order

1. **As client, add items to cart:**

   ```
   http://localhost:3000/dashboard/catalog
   ```

   - Add products from at least 2 different vendors
   - Verify cart shows items from multiple vendors

2. **Checkout:**

   ```
   http://localhost:3000/dashboard/checkout
   ```

   - Review order details
   - Click "Confirm Order"

3. **Verify order created:**

   ```sql
   SELECT
     o.id,
     o.orderNumber,
     o.status,
     COUNT(so.id) as suborder_count
   FROM "Order" o
   LEFT JOIN "SubOrder" so ON so.orderId = o.id
   WHERE o.orderNumber = 'your-order-number'
   GROUP BY o.id;
   ```

   Expected:

   - Status: `SUBMITTED`
   - SubOrder count: Number of vendors in order

#### Step 4: Confirm Order (Trigger Pre-Authorization)

1. **Navigate to admin orders:**

   ```
   http://localhost:3000/dashboard/orders
   ```

2. **Find your test order** and click to view details

3. **Change status to CONFIRMED:**

   - Click status dropdown
   - Select "CONFIRMED"
   - Click "Update Status"

4. **Monitor server logs:**
   Look for:

   ```
   [Pre-Auth] Authorizing charges for order: ord_...
   [Pre-Auth] SubOrder so_... authorized: pi_...
   [Pre-Auth] SubOrder so_... authorized: pi_...
   [Pre-Auth] All authorizations successful
   ```

5. **Check for errors:**
   If authorization fails, you'll see:
   ```json
   {
     "success": false,
     "error": "Failed to pre-authorize charges: SO-123: Card was declined"
   }
   ```

#### Step 5: Verify Pre-Authorization

1. **Check database:**

   ```sql
   SELECT
     so.id,
     so.subOrderNumber,
     so.status,
     so.stripeChargeId,
     so.paymentStatus,
     so.subTotalCents,
     v.name as vendor_name
   FROM "SubOrder" so
   JOIN "Vendor" v ON v.id = so.vendorId
   WHERE so.orderId = 'your-order-id';
   ```

   Expected for each SubOrder:

   - `stripeChargeId`: `pi_...` (PaymentIntent ID)
   - `paymentStatus`: `PROCESSING`
   - Status should still be based on vendor workflow

2. **Check Stripe Dashboard:**

   - Go to: https://dashboard.stripe.com/test/payments
   - Filter by: "Uncaptured"
   - Find your PaymentIntents
   - Verify:
     - Status: "Requires capture"
     - Amount matches SubOrder total
     - Customer matches client
     - Connected account matches vendor

3. **Verify on vendor's account:**
   - Switch to vendor's connected account in Stripe Dashboard
   - Go to Payments
   - See the authorized charge
   - Amount should match the SubOrder total

---

### Method 3: Direct API Testing

Test the API endpoint directly:

```bash
# Get auth token from browser DevTools (Application → Cookies → next-auth.session-token)

curl -X POST http://localhost:3000/api/stripe/authorize-charge \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "subOrderId": "your-suborder-id"
  }'
```

Expected response (success):

```json
{
  "success": true,
  "paymentIntentId": "pi_3..."
}
```

Expected response (already authorized):

```json
{
  "success": false,
  "error": "SubOrder already has a payment authorization",
  "paymentIntentId": "pi_3..."
}
```

---

## Test Scenarios

### ✅ Scenario 1: Happy Path

**Setup:**

- Client has payment method
- Vendor has Stripe Connect enabled
- Order with 2 SubOrders from different vendors

**Steps:**

1. Confirm order (SUBMITTED → CONFIRMED)
2. Verify both SubOrders get authorized
3. Check Stripe Dashboard shows 2 uncaptured charges

**Expected Result:**

- ✅ Order status changes to CONFIRMED
- ✅ Both SubOrders have `stripeChargeId`
- ✅ Both SubOrders have `paymentStatus: PROCESSING`
- ✅ Stripe shows uncaptured charges on vendor accounts

---

### ❌ Scenario 2: Client Missing Payment Method

**Setup:**

- Client does NOT have payment method
- Vendor has Stripe Connect enabled

**Steps:**

1. Try to confirm order

**Expected Result:**

- ❌ Order confirmation fails
- Error: "Client [name] does not have a default payment method"
- Order remains in SUBMITTED status

---

### ❌ Scenario 3: Vendor Missing Stripe Connect

**Setup:**

- Client has payment method
- Vendor does NOT have Stripe Connect

**Steps:**

1. Try to confirm order

**Expected Result:**

- ❌ Order confirmation fails
- Error: "Vendor [name] does not have a Stripe Connect account"
- Order remains in SUBMITTED status

---

### ❌ Scenario 4: Card Declined

**Setup:**

- Client has payment method using test card `4000 0000 0000 9995` (always declines)
- Vendor has Stripe Connect enabled

**Steps:**

1. Try to confirm order

**Expected Result:**

- ❌ Order confirmation fails
- Error: "Failed to pre-authorize charges: SO-XXX: Card was declined"
- Order remains in SUBMITTED status
- No charges created

---

### ✅ Scenario 5: Idempotency

**Setup:**

- Order already confirmed with pre-authorization

**Steps:**

1. Try to authorize the same SubOrder again

**Expected Result:**

- ✅ Returns success with existing PaymentIntent ID
- No duplicate charge created
- Database unchanged

---

### ✅ Scenario 6: Partial Success Handling

**Setup:**

- Order with 2 SubOrders
- First vendor: OK
- Second vendor: No Stripe Connect

**Steps:**

1. Try to confirm order

**Expected Result:**

- ❌ Order confirmation fails
- Error mentions which SubOrder failed
- No charges created (all-or-nothing)
- Order remains in SUBMITTED status

---

## Stripe Test Cards

Use these cards to test different scenarios:

| Card Number         | Scenario           | Result                     |
| ------------------- | ------------------ | -------------------------- |
| 4242 4242 4242 4242 | Success            | Authorization succeeds     |
| 4000 0000 0000 9995 | Declined           | "Insufficient funds"       |
| 4000 0000 0000 9987 | Declined           | "Card was declined"        |
| 4000 0000 0000 0341 | Attaches but fails | Setup succeeds, auth fails |
| 4000 0025 0000 3155 | Requires auth      | 3D Secure required         |

Full list: https://stripe.com/docs/testing

---

## Database Verification Queries

### Check SubOrder Payment Status

```sql
SELECT
  so.subOrderNumber,
  so.status,
  so.paymentStatus,
  so.stripeChargeId,
  so.subTotalCents,
  v.name as vendor_name,
  v.chargesEnabled
FROM "SubOrder" so
JOIN "Vendor" v ON v.id = so.vendorId
WHERE so.orderId = 'your-order-id'
ORDER BY so.createdAt;
```

### Check Order Audit Log

```sql
SELECT
  al.action,
  al.diff,
  al.createdAt,
  u.name as user_name
FROM "AuditLog" al
LEFT JOIN "User" u ON u.id = al.userId
WHERE al.entityType = 'Order'
  AND al.entityId = 'your-order-id'
ORDER BY al.createdAt DESC;
```

### Find Authorized Charges

```sql
SELECT
  so.subOrderNumber,
  so.stripeChargeId,
  so.paymentStatus,
  so.subTotalCents / 100.0 as amount_eur,
  v.name as vendor_name,
  c.name as client_name
FROM "SubOrder" so
JOIN "Vendor" v ON v.id = so.vendorId
JOIN "Order" o ON o.id = so.orderId
JOIN "Client" c ON c.id = o.clientId
WHERE so.stripeChargeId IS NOT NULL
  AND so.paymentStatus = 'PROCESSING'
ORDER BY so.createdAt DESC;
```

---

## Monitoring & Debugging

### Enable Stripe CLI Webhook Forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### Watch Server Logs

```bash
npm run dev 2>&1 | grep -E "\[Pre-Auth\]|\[WEBHOOK\]"
```

### Check Stripe Dashboard

- **Test mode payments:** https://dashboard.stripe.com/test/payments
- **Filter:** "Uncaptured" charges
- **Connected accounts:** Switch account dropdown

### Common Issues

#### Issue: "Client does not have a Stripe Customer ID"

**Cause:** Client record missing `stripeCustomerId`

**Fix:**

1. Call `/api/stripe/customers` to create customer
2. Or manually set in database (testing only)

#### Issue: "Vendor is not enabled to accept charges"

**Cause:** Vendor's `chargesEnabled` is false

**Fix:**

1. Complete Stripe Connect onboarding
2. Wait for webhook `account.updated` with `charges_enabled: true`
3. Or manually set in database (testing only)

#### Issue: "Invalid Stripe account"

**Cause:** Vendor's `stripeAccountId` is invalid or deleted

**Fix:**

1. Reconnect vendor's Stripe account
2. Use a different vendor for testing

#### Issue: "Payment method is not available"

**Cause:** Payment method not compatible with connected account

**Fix:**

1. Use a different test card
2. Check payment method type is supported (cards should work)

---

## Cleanup After Testing

To reset test data:

```sql
-- Remove test orders and related data
DELETE FROM "SubOrder" WHERE orderId IN (
  SELECT id FROM "Order" WHERE orderNumber LIKE 'TEST-%'
);

DELETE FROM "Order" WHERE orderNumber LIKE 'TEST-%';
```

Or use Stripe CLI to cancel test PaymentIntents:

```bash
# List uncaptured payment intents
stripe payment_intents list --uncaptured

# Cancel specific payment intent
stripe payment_intents cancel pi_3...
```

---

## Next Steps After Pre-Authorization

Once charges are pre-authorized:

1. **Vendor fulfills order** (status: READY)
2. **Driver picks up and delivers**
3. **Capture charges** (future phase):

   ```javascript
   await stripe.paymentIntents.capture(paymentIntentId, {
     stripeAccount: vendorStripeAccountId,
   });
   ```

4. **Update SubOrder:**
   - `paymentStatus: SUCCEEDED`
   - `paidAt: new Date()`

---

## Reference

- [Issue #101](https://github.com/brennanlazzara/hydra/issues/101)
- [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Manual Capture](https://stripe.com/docs/payments/capture-later)
- [Test Cards](https://stripe.com/docs/testing)
