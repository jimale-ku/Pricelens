# 💳 Subscription & Stripe Integration Guide
## Complete Implementation Plan for Free/Paid Tiers

---

## 🎯 Overview

This guide covers implementing a freemium model (Free vs Paid tiers) with Stripe integration for PriceLens. Users can start with a free tier and upgrade to a paid subscription for premium features.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Feature Gating Strategy](#feature-gating-strategy)
6. [Stripe Setup](#stripe-setup)
7. [Testing Checklist](#testing-checklist)

---

## 🏗️ Architecture Overview

### **Subscription Flow:**

```
User Registration
    ↓
Default: FREE tier
    ↓
User wants premium features
    ↓
Click "Upgrade" → Stripe Checkout
    ↓
Payment successful → Webhook updates subscription
    ↓
User gets access to premium features
```

### **Feature Tiers:**

#### **FREE Tier:**
- ✅ Basic product search (limited to 10 searches/day)
- ✅ View prices from 3 stores max
- ✅ Save up to 5 favorites
- ✅ Create 1 shopping list
- ✅ Basic price alerts (1 active alert)
- ❌ No price history
- ❌ No advanced filters
- ❌ No saved comparisons

#### **PAID Tier (Plus):**
- ✅ Unlimited product searches
- ✅ View prices from all stores (10+)
- ✅ Unlimited favorites
- ✅ Unlimited shopping lists
- ✅ Unlimited price alerts
- ✅ 90-day price history
- ✅ Advanced filters & sorting
- ✅ Save unlimited comparisons
- ✅ Priority customer support
- ✅ Ad-free experience

---

## 🗄️ Database Schema Changes

### **New Models:**

1. **SubscriptionPlan** - Defines available plans (Free, Plus)
2. **Subscription** - Tracks user subscriptions
3. **StripeCustomer** - Links users to Stripe customers

### **Updated Models:**

- **User** - Add subscription relationship

---

## 🔧 Backend Implementation

### **Step 1: Update Prisma Schema**

Add subscription models to `server/prisma/schema.prisma`:

```prisma
enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
  TRIALING
}

enum SubscriptionTier {
  FREE
  PLUS
}

model SubscriptionPlan {
  id          String   @id @default(uuid())
  name        String   @unique // "Free", "Plus"
  tier        SubscriptionTier @unique
  price       Decimal  @db.Decimal(10, 2) @default(0)
  currency    String   @default("USD")
  interval    String   // "month", "year"
  stripePriceId String? @unique
  features    Json     // Array of feature strings
  maxSearches Int?     // null = unlimited
  maxStores   Int?     // null = unlimited
  maxFavorites Int?    // null = unlimited
  maxLists    Int?     // null = unlimited
  maxAlerts   Int?     // null = unlimited
  hasPriceHistory Boolean @default(false)
  hasAdvancedFilters Boolean @default(false)
  hasAdFree Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  subscriptions Subscription[]

  @@index([tier])
}

model Subscription {
  id                String             @id @default(uuid())
  userId            String             @unique
  planId            String
  status            SubscriptionStatus @default(ACTIVE)
  tier              SubscriptionTier  @default(FREE)
  stripeSubscriptionId String?         @unique
  stripeCustomerId  String?
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean           @default(false)
  canceledAt         DateTime?
  trialEndsAt        DateTime?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  user               User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan               SubscriptionPlan  @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([tier])
}

model StripeCustomer {
  id              String   @id @default(uuid())
  userId          String   @unique
  stripeCustomerId String  @unique
  email           String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([stripeCustomerId])
}
```

Update User model:

```prisma
model User {
  // ... existing fields ...
  subscription     Subscription?
  stripeCustomer   StripeCustomer?
}
```

---

### **Step 2: Install Stripe SDK**

```bash
cd server
npm install stripe
npm install --save-dev @types/stripe
```

---

### **Step 3: Create Subscription Module**

#### **3.1 Subscription Service** (`server/src/subscriptions/subscriptions.service.ts`)

Key methods:
- `getUserSubscription(userId)` - Get user's current subscription
- `createCheckoutSession(userId, planId)` - Create Stripe checkout
- `handleWebhook(event)` - Process Stripe webhooks
- `cancelSubscription(userId)` - Cancel subscription
- `upgradeSubscription(userId, planId)` - Upgrade plan
- `checkFeatureAccess(userId, feature)` - Check if user can access feature

#### **3.2 Subscription Controller** (`server/src/subscriptions/subscriptions.controller.ts`)

Endpoints:
- `GET /subscriptions/me` - Get current subscription
- `GET /subscriptions/plans` - List available plans
- `POST /subscriptions/checkout` - Create checkout session
- `POST /subscriptions/cancel` - Cancel subscription
- `POST /subscriptions/webhook` - Stripe webhook handler

#### **3.3 Subscription Guards** (`server/src/subscriptions/guards/subscription.guard.ts`)

- `@RequireSubscription('PLUS')` - Decorator to protect premium routes
- `@RequireFeature('price_history')` - Decorator for specific features

---

### **Step 4: Feature Gating Implementation**

#### **4.1 Create Feature Service** (`server/src/subscriptions/features.service.ts`)

```typescript
@Injectable()
export class FeaturesService {
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription.plan;
    
    switch (feature) {
      case 'unlimited_searches':
        return plan.maxSearches === null;
      case 'all_stores':
        return plan.maxStores === null;
      case 'price_history':
        return plan.hasPriceHistory;
      // ... other features
    }
  }
  
  async checkUsageLimit(userId: string, feature: string): Promise<boolean> {
    // Check if user has exceeded limits
  }
}
```

#### **4.2 Update Existing Services**

Add feature checks to:
- `ProductsService` - Limit searches, stores
- `FavoritesService` - Limit favorites count
- `ListsService` - Limit lists count
- `PriceAlertsService` - Limit alerts count

---

## 🎨 Frontend Implementation

### **Step 1: Install Stripe React Native SDK**

```bash
cd client
npm install @stripe/stripe-react-native
```

### **Step 2: Create Subscription Components**

#### **2.1 Subscription Status Component** (`client/components/subscription/SubscriptionBadge.tsx`)

Shows "Plus Member" badge in header when subscribed.

#### **2.2 Upgrade Modal** (`client/components/subscription/UpgradeModal.tsx`)

Shows:
- Current plan vs Plus plan comparison
- Feature list
- "Upgrade to Plus" button
- Pricing information

#### **2.3 Subscription Management Screen** (`client/app/(tabs)/plus.tsx`)

- Current subscription status
- Usage statistics
- Manage subscription button
- Cancel subscription option

### **Step 3: Add Feature Gating to Existing Components**

- Show upgrade prompts when free users hit limits
- Disable premium features for free users
- Show "Upgrade to unlock" messages

---

## 🔐 Feature Gating Strategy

### **Backend Gating:**

1. **Route-Level Protection:**
   ```typescript
   @Get('price-history/:productId')
   @RequireSubscription('PLUS')
   async getPriceHistory(@Param('productId') productId: string) {
     // Only Plus users can access
   }
   ```

2. **Service-Level Checks:**
   ```typescript
   async searchProducts(query: string, userId: string) {
     const canSearch = await this.featuresService.checkUsageLimit(
       userId, 
       'searches'
     );
     if (!canSearch) {
       throw new ForbiddenException('Search limit reached. Upgrade to Plus!');
     }
     // ... perform search
   }
   ```

### **Frontend Gating:**

1. **Conditional Rendering:**
   ```typescript
   {isPlusMember ? (
     <PriceHistoryChart />
   ) : (
     <UpgradePrompt feature="Price History" />
   )}
   ```

2. **Usage Tracking:**
   - Track searches, favorites, lists in local state
   - Show progress bars
   - Display upgrade prompts when near limits

---

## 💳 Stripe Setup

### **Step 1: Create Stripe Account**

1. Sign up at https://stripe.com
2. Get API keys from Dashboard
3. Set up webhook endpoint

### **Step 2: Environment Variables**

Add to `server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_PLUS_YEARLY=price_...
```

### **Step 3: Create Products in Stripe Dashboard**

1. Create "PriceLens Plus" product
2. Create monthly price ($9.99/month)
3. Create yearly price ($99.99/year) - Optional
4. Copy Price IDs to `.env`

### **Step 4: Configure Webhook**

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `.env`

---

## 🧪 Testing Checklist

### **Backend Tests:**

- [ ] User registration creates FREE subscription
- [ ] Checkout session creation works
- [ ] Webhook handles subscription.created
- [ ] Webhook handles subscription.updated
- [ ] Webhook handles subscription.deleted
- [ ] Feature gating blocks free users from premium features
- [ ] Usage limits enforced for free users
- [ ] Subscription cancellation works

### **Frontend Tests:**

- [ ] Subscription badge shows for Plus users
- [ ] Upgrade modal displays correctly
- [ ] Stripe checkout redirects properly
- [ ] Feature prompts show for free users
- [ ] Usage limits displayed correctly
- [ ] Subscription management screen works

### **Integration Tests:**

- [ ] Complete subscription flow (signup → upgrade → access premium)
- [ ] Webhook updates subscription status
- [ ] Cancellation flow works
- [ ] Feature access changes after subscription change

---

## 📊 Usage Tracking

### **Track User Usage:**

Add usage tracking to database:

```prisma
model UserUsage {
  id            String   @id @default(uuid())
  userId        String
  date          DateTime @default(now())
  searches      Int      @default(0)
  favorites     Int      @default(0)
  lists         Int      @default(0)
  alerts        Int      @default(0)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@index([userId, date])
}
```

Reset daily usage at midnight (cron job).

---

## 🚀 Deployment Checklist

### **Before Going Live:**

- [ ] Switch to Stripe Live keys
- [ ] Update webhook URL to production
- [ ] Test complete subscription flow
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications for subscription events
- [ ] Set up customer support process for billing issues
- [ ] Test cancellation and refund flow
- [ ] Verify feature gating works correctly

---

## 📝 Next Steps

1. **Implement Database Changes** - Add subscription models
2. **Create Subscription Service** - Stripe integration
3. **Add Feature Gating** - Guards and decorators
4. **Update Frontend** - Subscription UI
5. **Test Thoroughly** - All flows
6. **Deploy** - Go live!

---

## 💡 Tips & Best Practices

1. **Start Simple:** Begin with monthly subscription only
2. **Clear Messaging:** Make it obvious what users get with Plus
3. **Soft Limits:** Warn users before hitting limits
4. **Easy Upgrade:** Make upgrade process frictionless
5. **Transparent Pricing:** Show exactly what they're paying for
6. **Handle Failures:** Gracefully handle payment failures
7. **Customer Support:** Have a plan for billing questions

---

## 🆘 Troubleshooting

### **Common Issues:**

1. **Webhook not receiving events:**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check Stripe dashboard for failed deliveries

2. **Subscription not updating:**
   - Verify webhook handler is working
   - Check database for subscription records
   - Review logs for errors

3. **Feature gating not working:**
   - Verify subscription status in database
   - Check guard implementation
   - Test with different user tiers

---

**Ready to implement? Let's start with the database schema!** 🚀







