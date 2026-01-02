# Stripe Webhook Testing Guide

## Overview
This guide explains how to test the Stripe webhook endpoint locally during development.

## Prerequisites
- Stripe CLI installed: https://stripe.com/docs/stripe-cli
- Development server running on `http://localhost:3000`
- Stripe account with test API keys configured

## Setup

### 1. Install Stripe CLI
```bash
# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe
```bash
stripe login
```
This will open your browser to authenticate.

### 3. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

This command will:
- Display your webhook signing secret (whsec_...)
- Forward all Stripe events to your local endpoint
- Show webhook events in real-time

**Important:** Copy the webhook signing secret and add it to your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## Testing Scenarios

### Test 1: SetupIntent Success
Simulates a successful payment method setup:

```bash
stripe trigger setup_intent.succeeded
```

**Expected Result:**
- Console shows: `[WEBHOOK] Processing setup_intent.succeeded`
- Client record updated with `hasPaymentMethod: true`
- `defaultPaymentMethodId` set to the payment method ID

**Verify in logs:**
```
[WEBHOOK] Received event: { id: 'evt_...', type: 'setup_intent.succeeded', ... }
[WEBHOOK] Processing setup_intent.succeeded: { setupIntentId: 'seti_...', ... }
[WEBHOOK] Client updated successfully: { clientId: '...', paymentMethodId: 'pm_...', ... }
```

### Test 2: Payment Method Attached
Simulates when a payment method is attached to a customer:

```bash
stripe trigger payment_method.attached
```

**Expected Result:**
- Console shows: `[WEBHOOK] Processing payment_method.attached`
- Event is logged with card details

**Verify in logs:**
```
[WEBHOOK] Received event: { id: 'evt_...', type: 'payment_method.attached', ... }
[WEBHOOK] Processing payment_method.attached: { paymentMethodId: 'pm_...', ... }
```

### Test 3: End-to-End Payment Method Setup

1. **Add payment method through UI:**
   - Navigate to `/dashboard/billing`
   - Click "Add Payment Method"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

2. **Verify webhook handling:**
   - Check Stripe CLI output for webhook events
   - Check server console for `[WEBHOOK]` logs
   - Verify client record in database is updated

### Test 4: Idempotency
Test that duplicate events don't cause issues:

```bash
# Trigger the same event multiple times
stripe trigger setup_intent.succeeded
stripe trigger setup_intent.succeeded
stripe trigger setup_intent.succeeded
```

**Expected Result:**
- First event: Updates client record
- Subsequent events: Skipped with log message "Payment method already set as default"

## Monitoring Webhooks

### Real-time Event Stream
Keep the `stripe listen` command running to see all webhook events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

Output example:
```
> Ready! Your webhook signing secret is whsec_1234...
2024-12-31 15:30:00   --> setup_intent.succeeded [evt_123...]
2024-12-31 15:30:01   <--  [200] POST http://localhost:3000/api/stripe/webhooks [evt_123...]
```

### Server Logs
All webhook events are logged with the `[WEBHOOK]` prefix:

```bash
# Filter webhook logs
npm run dev 2>&1 | grep "\[WEBHOOK\]"
```

## Test Cards

Use these Stripe test cards:

| Card Number         | Description          |
|---------------------|----------------------|
| 4242 4242 4242 4242 | Success              |
| 4000 0000 0000 0341 | Attaches but fails   |
| 4000 0000 0000 9995 | Insufficient funds   |

Full list: https://stripe.com/docs/testing

## Troubleshooting

### Webhook Signature Verification Fails
**Error:** `Invalid signature`

**Solution:**
1. Make sure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from `stripe listen`
2. Restart your dev server after updating environment variables

### No Events Received
**Problem:** Webhook endpoint not receiving events

**Solution:**
1. Verify `stripe listen` is running and shows correct forward URL
2. Check dev server is running on `localhost:3000`
3. Verify no firewall blocking localhost connections

### Client Not Updated
**Problem:** Webhook processes but client record doesn't update

**Solution:**
1. Check client has a `stripeCustomerId` set
2. Verify customer ID in webhook event matches client record
3. Check database connection is working
4. Look for error logs in console

### Event Handling Errors
**Problem:** Webhook returns 500 error

**Solution:**
1. Check server console for error stack traces
2. Verify database is accessible
3. Check Prisma schema matches database structure

## Production Webhook Setup

In production, you'll need to:

1. **Create webhook endpoint in Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "+ Add endpoint"
   - URL: `https://your-domain.com/api/stripe/webhooks`
   - Events to send:
     - `setup_intent.succeeded`
     - `payment_method.attached`

2. **Copy webhook signing secret:**
   - Stripe will show the signing secret (whsec_...)
   - Add it to your production environment variables

3. **Test in production:**
   - Use Stripe Dashboard's "Send test webhook" feature
   - Monitor your production logs for `[WEBHOOK]` entries

## Security Notes

- ✅ Webhook signature verification prevents unauthorized requests
- ✅ All events are logged for audit trail
- ✅ Idempotent handling prevents duplicate processing
- ✅ Client customer ID validation ensures data integrity
- ⚠️  Never expose `STRIPE_WEBHOOK_SECRET` in client-side code
- ⚠️  Never commit `.env.local` to git

## Reference

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [SetupIntent Events](https://stripe.com/docs/api/events/types#event_types-setup_intent.succeeded)
