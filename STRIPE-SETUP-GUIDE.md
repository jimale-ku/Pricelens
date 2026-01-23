# 🔧 Stripe Setup Guide for PriceLens

## Quick Setup Steps

### 1. Create Stripe Account
1. Go to https://stripe.com and sign up
2. Complete account setup
3. Get your API keys from Dashboard → Developers → API keys

### 2. Create Products & Prices in Stripe

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Create "PriceLens Plus" product:
   - Name: `PriceLens Plus`
   - Description: `Premium subscription for unlimited features`
   - Pricing: `Recurring`
   - Price: `$9.99`
   - Billing period: `Monthly`
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_...`)

### 3. Set Up Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. For local development, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook
   ```
   This will give you a webhook signing secret (starts with `whsec_...`)

4. For production:
   - Endpoint URL: `https://yourdomain.com/api/subscriptions/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### 4. Update Environment Variables

Add to `server/.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your secret key from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your publishable key (for frontend)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
STRIPE_PRICE_ID_PLUS_MONTHLY=price_... # Price ID from step 2
FRONTEND_URL=http://localhost:3000 # Your frontend URL
```

### 5. Test the Integration

#### Using Stripe CLI (Recommended for Development):

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/subscriptions/webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

#### Test Subscription Flow:

1. Start your backend: `cd server && npm run start:dev`
2. Register a new user
3. Call `POST /api/subscriptions/checkout` with plan ID
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify webhook updates subscription in database

### 6. Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiry date, any CVC, and any ZIP code.

---

## Production Checklist

Before going live:

- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Update environment variables with **live keys** (start with `sk_live_...`)
- [ ] Update webhook endpoint to production URL
- [ ] Test complete subscription flow with real card (then refund)
- [ ] Set up email notifications for failed payments
- [ ] Configure customer support process
- [ ] Test cancellation flow
- [ ] Monitor webhook deliveries in Stripe Dashboard

---

## Troubleshooting

### Webhook not receiving events:
- Check webhook URL is correct
- Verify webhook secret matches
- Check Stripe Dashboard → Webhooks → Recent deliveries for errors
- Ensure raw body is being passed correctly

### Subscription not updating:
- Check webhook handler logs
- Verify subscription exists in Stripe Dashboard
- Check database for subscription records
- Review webhook event payloads in Stripe Dashboard

### Checkout session not working:
- Verify Stripe keys are correct
- Check plan has `stripePriceId` set
- Ensure frontend URL is correct
- Check browser console for errors

---

## Next Steps

1. ✅ Complete Stripe setup
2. ✅ Test subscription flow
3. ⏭️ Update frontend with subscription UI
4. ⏭️ Add feature gating to existing endpoints
5. ⏭️ Deploy to production

---

**Need help?** Check Stripe documentation: https://stripe.com/docs






