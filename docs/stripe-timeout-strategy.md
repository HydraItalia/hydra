# Stripe API Timeout Strategy

## Overview

This document describes the timeout and retry strategy implemented for Stripe API calls in the pre-authorization flow.

## Problem Statement

External API calls (like Stripe) can be slow or unresponsive, potentially:

- Blocking request threads indefinitely
- Exhausting the thread pool under load
- Causing cascading failures
- Providing poor user experience

## Solution: Multi-Layer Timeout Strategy

### Layer 1: Stripe SDK Configuration

**Location:** `src/lib/stripe-auth.ts`

```typescript
stripeInstance = new Stripe(secretKey, {
  apiVersion: "2025-12-15.clover",
  timeout: 25000, // 25 second timeout per API call
  maxNetworkRetries: 2, // Retry failed requests up to 2 times
});
```

**Benefits:**

- Each individual Stripe API call times out after 25 seconds
- Automatic retry on transient network failures (up to 2 retries)
- Built-in exponential backoff between retries

**Failure Modes:**

- Network errors: Automatically retried
- API errors (card declined, etc.): Immediately returned, not retried
- Timeout: Throws error after 25 seconds

---

### Layer 2: Authorization Function Timeout

**Location:** `src/actions/admin-orders.ts`

```typescript
const AUTHORIZATION_TIMEOUT_MS = 30000; // 30 seconds

const result = await withTimeout(
  authorizeSubOrderCharge(subOrder.id),
  AUTHORIZATION_TIMEOUT_MS,
  `Authorization timed out after 30s for SubOrder ${subOrder.subOrderNumber}`
);
```

**Benefits:**

- Overall timeout for entire authorization flow (30 seconds)
- Accounts for Stripe SDK retries (25s × 3 attempts = potential 75s)
- Provides clear timeout error messages
- Prevents infinite hangs

**Why 30 seconds?**

- Stripe SDK timeout: 25 seconds
- Database operations: ~1-2 seconds
- Buffer for retries: The 30s limit applies to the entire operation, so retries need to complete within this window
- Total: 30 seconds provides reasonable time while preventing hangs

---

### Layer 3: Parallel Processing with Individual Timeouts

**Location:** `src/actions/admin-orders.ts`

```typescript
const results = await Promise.allSettled(
  subOrders.map(async (subOrder) => {
    try {
      const result = await withTimeout(
        authorizeSubOrderCharge(subOrder.id),
        AUTHORIZATION_TIMEOUT_MS,
        `Authorization timed out...`
      );
      // Handle result
    } catch (error) {
      // Handle timeout or error
    }
  })
);
```

**Benefits:**

- Each SubOrder authorization runs in parallel
- Individual timeout per SubOrder (not cumulative)
- One slow/failing authorization doesn't block others
- `Promise.allSettled` ensures all attempts complete before returning

**Example:**

- Order with 3 SubOrders
- SubOrder 1: Succeeds in 2 seconds
- SubOrder 2: Times out after 30 seconds
- SubOrder 3: Succeeds in 5 seconds
- **Total time:** ~30 seconds (parallel execution)
- **Result:** 2 succeed, 1 fails with timeout error

---

## Timeout Flow Diagram

```
Order Confirmation Request
    ↓
For each SubOrder (parallel):
    ↓
    [30s timeout] → authorizeSubOrderCharge()
        ↓
        Fetch SubOrder from DB (~500ms)
        ↓
        [25s timeout, 2 retries] → Stripe PaymentIntent.create()
            ↓
            Stripe API request (~2-5s normally)
            ↓
            On network error: Retry with exponential backoff
            ↓
            On timeout: Throw error after 25s
        ↓
        Update database (~200ms)
        ↓
    Return result or timeout error
    ↓
Collect all results
    ↓
If any failed: Return detailed error
If all succeeded: Update order status
```

---

## Error Handling

### Timeout Error Message

```json
{
  "success": false,
  "error": "Failed to pre-authorize charges: SO-123: Authorization timed out after 30s for SubOrder SO-123"
}
```

### Network Error (After Retries)

```json
{
  "success": false,
  "error": "Failed to pre-authorize charges: SO-123: Payment service temporarily unavailable"
}
```

### Stripe API Error (Card Declined)

```json
{
  "success": false,
  "error": "Failed to pre-authorize charges: SO-123: Card was declined"
}
```

---

## Configuration

### Adjusting Timeouts

**Stripe SDK Timeout:**

```typescript
// src/lib/stripe-auth.ts
stripeInstance = new Stripe(secretKey, {
  timeout: 25000, // Adjust this value (in milliseconds)
});
```

**Authorization Timeout:**

```typescript
// src/actions/admin-orders.ts
const AUTHORIZATION_TIMEOUT_MS = 30000; // Adjust this value
```

**Recommended Values:**

| Environment | Stripe SDK | Authorization | Reasoning                      |
| ----------- | ---------- | ------------- | ------------------------------ |
| Development | 25s        | 30s           | Allow time for debugging       |
| Production  | 15s        | 20s           | Faster failure for better UX   |
| High-Volume | 10s        | 15s           | Prevent thread pool exhaustion |

---

## Monitoring

### Metrics to Track

1. **Authorization Success Rate**

   - Track % of successful authorizations
   - Alert if < 95%

2. **Timeout Rate**

   - Track % of authorizations that timeout
   - Alert if > 2%

3. **Average Authorization Time**

   - Track p50, p95, p99 latencies
   - Alert if p95 > 10 seconds

4. **Stripe API Response Time**
   - Track time spent in Stripe API calls
   - Correlate with Stripe status page

### Log Examples

**Success:**

```
[Pre-Auth] SubOrder so_123 authorized: pi_xyz (2.3s)
```

**Timeout:**

```
[Pre-Auth] Authorization timed out after 30s for SubOrder SO-123
```

**Orphaned PaymentIntent:**

```
[Pre-Auth] Database update failed for SubOrder so_123, PaymentIntent pi_xyz is orphaned
[Pre-Auth] Canceled orphaned PaymentIntent pi_xyz
```

---

## Testing Timeout Scenarios

### Simulate Slow Stripe API

```bash
# Using Stripe CLI with webhook delays
stripe trigger payment_intent.succeeded --delay 35000
```

### Test Timeout Handling

1. **Modify timeout to 1 second (for testing):**

   ```typescript
   const AUTHORIZATION_TIMEOUT_MS = 1000; // 1 second
   ```

2. **Confirm an order:**

   - Should fail quickly with timeout error
   - No charges should be created
   - Order should remain in SUBMITTED status

3. **Verify error message:**

   ```
   Authorization timed out after 1s for SubOrder SO-XXX
   ```

4. **Restore production timeout:**
   ```typescript
   const AUTHORIZATION_TIMEOUT_MS = 30000; // 30 seconds
   ```

---

## Failure Recovery

### What Happens on Timeout?

1. **No PaymentIntent created:** Safe - no charges
2. **PaymentIntent created, DB update times out:**

   - Automatic cleanup: PaymentIntent is canceled
   - Logged as orphaned PaymentIntent
   - Safe - no charges captured

3. **Partial success (some SubOrders timeout):**
   - All-or-nothing: Order confirmation fails
   - Successful authorizations remain (can be used on retry)
   - Clear error shows which SubOrders failed

### Retry Strategy

**User retries order confirmation:**

1. System checks existing `stripeChargeId`
2. If exists and valid: Skips re-authorization (idempotent)
3. If missing/invalid: Creates new authorization
4. Result: Safe retries without duplicate charges

---

## Best Practices

### DO

- ✅ Use reasonable timeout values (15-30 seconds)
- ✅ Monitor timeout rates in production
- ✅ Log timeout occurrences for investigation
- ✅ Test timeout scenarios regularly
- ✅ Update timeouts based on production metrics

### DON'T

- ❌ Set timeouts too low (< 10 seconds) - causes false failures
- ❌ Set timeouts too high (> 60 seconds) - poor user experience
- ❌ Ignore timeout errors in logs - may indicate Stripe issues
- ❌ Remove timeout handling - leaves system vulnerable to hangs

---

## Related Documentation

- [Stripe Error Handling](https://stripe.com/docs/error-handling)
- [Stripe Timeouts](https://stripe.com/docs/api/request_timeout)
- [Testing Pre-Authorization](./testing-pre-authorization.md)
- [Production Monitoring](./production-monitoring.md)

---

## Summary

**Three layers of protection:**

1. **Stripe SDK**: 25s timeout, 2 retries per API call
2. **Authorization Function**: 30s overall timeout per SubOrder
3. **Parallel Processing**: Each SubOrder has independent timeout

**Result:**

- Fast failure on slow/unresponsive APIs
- Clear error messages for debugging
- No thread pool exhaustion
- Excellent user experience
- Production-ready reliability
