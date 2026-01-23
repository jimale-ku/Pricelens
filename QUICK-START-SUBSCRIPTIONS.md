# 🚀 Quick Start: Subscription System

## What's Been Implemented

✅ **Database Schema** - Subscription models added to Prisma  
✅ **Stripe Integration** - Full subscription service with webhooks  
✅ **Feature Gating** - Guards and decorators for premium features  
✅ **Auto-Free Tier** - New users automatically get FREE subscription  
✅ **API Endpoints** - Complete subscription management endpoints  

---

## Next Steps (Run These Commands)

### 1. Install Stripe SDK
```bash
cd server
npm install stripe
```

### 2. Generate Prisma Client
```bash
cd server
npx prisma generate
```

### 3. Create Database Migration
```bash
cd server
npx prisma migrate dev --name add_subscription_models
```

### 4. Seed Subscription Plans
```bash
cd server
npm run seed
```

This creates:
- **FREE Plan** - Limited features (10 searches/day, 3 stores, etc.)
- **PLUS Plan** - Unlimited features ($9.99/month)

---

## Environment Variables Needed

Add to `server/.env`:

```env
# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe CLI or Dashboard
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...  # Create in Stripe Dashboard
FRONTEND_URL=http://localhost:3000
```

**See `STRIPE-SETUP-GUIDE.md` for detailed setup instructions.**

---

## API Endpoints Available

### Get Current Subscription
```
GET /api/subscriptions/me
Authorization: Bearer <token>
```

### Get All Plans
```
GET /api/subscriptions/plans
```

### Create Checkout Session
```
POST /api/subscriptions/checkout
Authorization: Bearer <token>
Body: { "planId": "..." }
```

### Cancel Subscription
```
POST /api/subscriptions/cancel
Authorization: Bearer <token>
```

### Webhook (Stripe)
```
POST /api/subscriptions/webhook
```

---

## How It Works

1. **User Registration** → Automatically gets FREE subscription
2. **User Upgrades** → Calls `/checkout` → Redirects to Stripe
3. **Payment Success** → Stripe webhook → Updates subscription in DB
4. **Feature Access** → Use `@RequireSubscription('PLUS')` decorator

---

## Using Feature Gating

### In Controllers:

```typescript
import { RequireSubscription } from '../subscriptions/decorators/require-subscription.decorator';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';

@Get('price-history/:id')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequireSubscription('PLUS')
async getPriceHistory(@Param('id') id: string) {
  // Only Plus users can access
}
```

### In Services:

```typescript
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

async searchProducts(query: string, userId: string) {
  // Check usage limit
  const limit = await this.subscriptionsService.checkUsageLimit(
    userId,
    'searches'
  );
  
  if (!limit.allowed) {
    throw new ForbiddenException('Search limit reached. Upgrade to Plus!');
  }
  
  // Increment usage
  await this.subscriptionsService.incrementUsage(userId, 'searches');
  
  // ... perform search
}
```

---

## Testing

1. **Register a user** → Check they have FREE subscription
2. **Get plans** → `GET /api/subscriptions/plans`
3. **Create checkout** → `POST /api/subscriptions/checkout` with Plus plan ID
4. **Use test card**: `4242 4242 4242 4242`
5. **Verify webhook** → Check subscription updated in database

---

## What's Next?

1. ✅ Backend is ready!
2. ⏭️ Update frontend with subscription UI
3. ⏭️ Add feature gating to existing endpoints
4. ⏭️ Test complete flow
5. ⏭️ Deploy!

---

**Need help?** Check:
- `SUBSCRIPTION-IMPLEMENTATION-GUIDE.md` - Full documentation
- `STRIPE-SETUP-GUIDE.md` - Stripe setup steps






