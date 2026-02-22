# 💳 Stripe Payment Flow & Premium Feature Unlocking

## 📋 Complete Payment Flow (Current Implementation)

### **Step-by-Step Process:**

```
1. User clicks "Upgrade" on Plus page
   ↓
2. Frontend calls: POST /subscriptions/checkout
   Body: { planId: "basic-plan-id", interval: "month" }
   ↓
3. Backend creates Stripe Checkout Session
   - Creates/gets Stripe Customer
   - Creates checkout session with trial period (if applicable)
   - Returns: { sessionId, url: "https://checkout.stripe.com/..." }
   ↓
4. Frontend opens Stripe URL in browser
   - User enters payment details
   - Stripe processes payment
   ↓
5. Stripe sends webhook to backend
   POST /subscriptions/webhook
   Events: checkout.session.completed, subscription.created/updated
   ↓
6. Backend updates database
   - Updates Subscription table with:
     * status: ACTIVE or TRIALING
     * tier: BASIC/PRO/PREMIUM
     * stripeSubscriptionId
     * currentPeriodStart/End
   ↓
7. Features are automatically unlocked
   - Backend checks subscription tier on each request
   - Frontend checks subscription status via GET /subscriptions/me
```

---

## 🔐 How Premium Features Get Unlocked

### **Backend Feature Gating:**

#### **1. Route-Level Protection (Guards)**
```typescript
// Example: Protect premium endpoint
@Get('price-history/:productId')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequireSubscription('PRO')  // Requires PRO or PREMIUM tier
async getPriceHistory(@Param('productId') productId: string) {
  // Only PRO/PREMIUM users can access
}
```

#### **2. Service-Level Checks**
```typescript
// Check if user can access feature
const canAccess = await subscriptionsService.canAccessFeature(
  userId, 
  'price_history'  // or 'unlimited_searches', 'all_stores', etc.
);

// Check usage limits
const limit = await subscriptionsService.checkUsageLimit(
  userId, 
  'searches'  // Returns: { allowed: true/false, current: 5, limit: 10 }
);
```

#### **3. Feature Checks Available:**
- `unlimited_searches` - Checks if maxSearches === null
- `all_stores` - Checks if maxStores === null
- `unlimited_favorites` - Checks if maxFavorites === null
- `unlimited_lists` - Checks if maxLists === null
- `unlimited_alerts` - Checks if maxAlerts === null
- `price_history` - Checks if hasPriceHistory === true
- `advanced_filters` - Checks if hasAdvancedFilters === true
- `ad_free` - Checks if hasAdFree === true

---

## 🎯 Current Implementation Status

### ✅ **What's Working:**

1. **Backend Stripe Integration:**
   - ✅ Checkout session creation
   - ✅ Webhook handling
   - ✅ Subscription status updates
   - ✅ Feature gating guards
   - ✅ Usage limit checks

2. **Frontend:**
   - ✅ Upgrade button calls checkout API
   - ✅ Opens Stripe checkout URL
   - ✅ Can fetch subscription status

### ⚠️ **What Needs Improvement:**

1. **Success Flow:**
   - ❌ After payment, user is redirected to web URL (not back to app)
   - ❌ No automatic subscription refresh after payment
   - ❌ User has to manually check if payment succeeded

2. **Frontend Feature Gating:**
   - ⚠️ Limited checks - mostly relies on backend
   - ⚠️ No real-time subscription status updates
   - ⚠️ No upgrade prompts when hitting limits

---

## 🔧 How to Fix the Payment Flow

### **Option 1: Deep Link Back to App (Recommended)**

#### **Backend Changes:**
```typescript
// In subscriptions.service.ts - createCheckoutSession()
success_url: `${process.env.FRONTEND_URL || 'pricelens://subscription/success?session_id={CHECKOUT_SESSION_ID}'}`,
cancel_url: `${process.env.FRONTEND_URL || 'pricelens://subscription/cancel'}`,
```

#### **Frontend Changes:**
1. **Add deep link handler** in `app/_layout.tsx`:
```typescript
import { Linking } from 'react-native';

useEffect(() => {
  const handleDeepLink = async (url: string) => {
    if (url.includes('/subscription/success')) {
      // Refresh subscription status
      await fetchSubscription();
      // Navigate to Plus page showing success
      router.push('/(tabs)/plus');
    }
  };

  Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
}, []);
```

2. **Add success/cancel screens** (`app/subscription/success.tsx`):
```typescript
export default function SubscriptionSuccess() {
  useEffect(() => {
    // Refresh subscription
    fetchSubscription();
    // Show success message
    Alert.alert('Success!', 'Your subscription is now active.');
    // Navigate to Plus page
    router.replace('/(tabs)/plus');
  }, []);
}
```

### **Option 2: Polling After Checkout (Simpler)**

#### **Frontend Changes:**
```typescript
const handleUpgrade = async () => {
  // ... existing checkout code ...
  
  if (data?.url) {
    await Linking.openURL(data.url);
    
    // Start polling for subscription update
    const pollInterval = setInterval(async () => {
      const res = await fetch(API_ENDPOINTS.subscriptions.me, {
        credentials: 'include',
      });
      const subscription = await res.json();
      
      if (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING') {
        clearInterval(pollInterval);
        Alert.alert('Success!', 'Your subscription is now active.');
        // Refresh UI
        fetchSubscription();
      }
    }, 3000); // Check every 3 seconds
    
    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);
  }
};
```

---

## 🎨 Frontend Feature Gating Implementation

### **1. Create Subscription Hook:**

```typescript
// hooks/useSubscription.ts
export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ENDPOINTS.subscriptions.me, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSubscription(data);
        setLoading(false);
      });
  }, []);

  const isPlusMember = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING';
  const tier = subscription?.tier || 'FREE';
  
  return { subscription, loading, isPlusMember, tier };
}
```

### **2. Use in Components:**

```typescript
// Example: Gating price history feature
const { isPlusMember, tier } = useSubscription();

{isPlusMember ? (
  <PriceHistoryChart productId={productId} />
) : (
  <UpgradePrompt 
    feature="Price History"
    message="Upgrade to Pro or Premium to see 30-90 day price history"
  />
)}
```

### **3. Usage Limit Checks:**

```typescript
// Check search limit before allowing search
const { subscription } = useSubscription();
const plan = subscription?.plan;

const canSearch = plan?.maxSearches === null || 
  (userSearchesToday < plan.maxSearches);

if (!canSearch) {
  Alert.alert(
    'Search Limit Reached',
    `You've used ${plan.maxSearches} searches today. Upgrade for unlimited searches!`,
    [{ text: 'Upgrade', onPress: () => router.push('/(tabs)/plus') }]
  );
  return;
}
```

---

## 📝 Testing Checklist

### **Payment Flow:**
- [ ] User can click "Upgrade" button
- [ ] Stripe checkout opens correctly
- [ ] User can complete payment
- [ ] Webhook updates subscription in database
- [ ] User is redirected back to app (or app detects success)
- [ ] Subscription status refreshes automatically
- [ ] Premium features become accessible immediately

### **Feature Gating:**
- [ ] Free users see upgrade prompts
- [ ] Premium users can access all features
- [ ] Usage limits are enforced
- [ ] Subscription status is checked on app open
- [ ] Cancelled subscriptions lose access

---

## 🚀 Quick Setup Steps

### **1. Stripe Dashboard Setup:**
1. Create Products: Basic, Pro, Premium
2. Create Prices for each (monthly + yearly)
3. Copy Price IDs to `.env`:
   ```
   STRIPE_PRICE_ID_BASIC_MONTHLY=price_xxx
   STRIPE_PRICE_ID_BASIC_YEARLY=price_xxx
   STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
   STRIPE_PRICE_ID_PRO_YEARLY=price_xxx
   STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxx
   STRIPE_PRICE_ID_PREMIUM_YEARLY=price_xxx
   ```

### **2. Webhook Setup:**
1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend.com/subscriptions/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

### **3. Test Payment:**
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- Payment will succeed in test mode

---

## 📊 Current Flow Diagram

```
┌─────────────┐
│   User      │
│  Clicks     │
│  "Upgrade"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Frontend           │
│  POST /checkout     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Backend            │
│  Creates Stripe     │
│  Checkout Session   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Stripe Checkout    │
│  User Pays          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Stripe Webhook     │
│  → Backend          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Database Updated   │
│  Subscription:      │
│  status=ACTIVE      │
│  tier=BASIC/PRO/    │
│      PREMIUM        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Features Unlocked  │
│  Based on Tier      │
└─────────────────────┘
```

---

## 💡 Summary

**Current State:**
- ✅ Backend fully integrated with Stripe
- ✅ Webhooks update subscriptions automatically
- ✅ Feature gating works on backend
- ⚠️ Frontend needs better success handling
- ⚠️ Need to add frontend feature checks

**What Users Experience:**
1. Click "Upgrade" → Stripe checkout opens
2. Pay → Webhook updates subscription
3. Features unlock automatically (backend)
4. Frontend needs to refresh to show new status

**Next Steps:**
1. Add deep link handling for success flow
2. Create `useSubscription` hook
3. Add frontend feature gating
4. Add upgrade prompts when hitting limits
5. Test complete flow end-to-end
