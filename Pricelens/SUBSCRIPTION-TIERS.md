# Subscription Tiers (Free + 3 Paid)

PriceLens uses **4 tiers** like modern apps: **Free** plus **Basic**, **Pro**, and **Premium**.

---

## Tiers and limits

| Feature            | Free   | Basic ($6/mo) | Pro ($12/mo) | Premium ($25/mo) |
|--------------------|--------|----------------|--------------|------------------|
| Searches/day       | 10     | 50             | 200          | Unlimited        |
| Stores per product | 3      | 10             | 25           | All (30+)        |
| Favorites          | 5      | 20             | Unlimited    | Unlimited        |
| Shopping lists     | 1      | 5              | Unlimited    | Unlimited        |
| Price alerts       | 1      | 5              | Unlimited    | Unlimited        |
| Price history      | —      | 7 days         | 30 days      | 90 days          |
| Advanced filters   | —      | —              | ✅           | ✅               |
| Ad-free            | —      | —              | ✅           | ✅               |
| Priority support   | —      | —              | —            | ✅               |

Yearly prices (optional): Basic $60, Pro $120, Premium $250 (about 2 months free).

---

## Backend

- **Plans:** Stored in `SubscriptionPlan`; seed creates Free, Basic, Pro, Premium.
- **Guard:** `@RequireSubscription('PRO')` — user must have **at least** that tier (e.g. PRO or PREMIUM).
- **Checkout:** `POST /subscriptions/checkout` body: `{ planId, interval?: 'month' | 'year' }`.
- **APIs:** `GET /subscriptions/me`, `GET /subscriptions/plans`, cancel, webhook (see `subscriptions.controller.ts`).

---

## What you need to do

1. **Run the migration** (adds BASIC, PRO, PREMIUM and yearly price fields):
   ```bash
   cd server && npx prisma migrate deploy
   ```
   Or for a new DB: `npx prisma migrate dev --name add_three_paid_tiers` (then apply the migration it creates).

2. **Seed plans:**
   ```bash
   cd server && npx prisma db seed
   ```

3. **Stripe (when you’re ready):** In Stripe Dashboard create 3 Products (Basic, Pro, Premium) and for each:
   - One Price: monthly (e.g. $6, $12, $25).
   - One Price: yearly (e.g. $60, $120, $250).
   Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_BASIC_MONTHLY=price_...
   STRIPE_PRICE_ID_BASIC_YEARLY=price_...
   STRIPE_PRICE_ID_PRO_MONTHLY=price_...
   STRIPE_PRICE_ID_PRO_YEARLY=price_...
   STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
   STRIPE_PRICE_ID_PREMIUM_YEARLY=price_...
   ```

4. **Frontend:** Build a pricing page that:
   - Calls `GET /subscriptions/plans` for names, prices, `priceYearly`, and features.
   - For “Subscribe” calls `POST /subscriptions/checkout` with `{ planId, interval: 'month' | 'year' }` and redirects to `session.url`.
   - For gated features, call `GET /subscriptions/me` and enforce limits or show upgrade prompts using the plan’s `maxSearches`, `maxStores`, etc.

---

## Legacy PLUS tier

Existing subscriptions with tier `PLUS` are treated as **PRO** (same level). No code change needed; `subscription-tiers.ts` maps PLUS to level 2.
