# Stripe, Pricing Tiers & Analytics – Implementation Plan

## 1. Service categories test (done)

- **Script:** `server/test-all-service-categories.ts`
- **How to run:**
  1. In `server/.env` set `SERPER_API_KEY=your_key`.
  2. Start backend: `cd server && npm run start:dev`.
  3. In another terminal: `cd server && npx ts-node test-all-service-categories.ts`.

**Endpoints covered:**

| Category        | Endpoint / params |
|----------------|-------------------|
| Gas Stations   | `GET /services/gas-stations?zipCode=90210` |
| Gyms           | `GET /services/gyms?zipCode=90210` |
| Hotels         | `GET /services/hotels?location=Los Angeles` |
| Oil Changes    | `GET /services/oil-changes?zipCode=90210` |
| Tires          | `GET /services/tires?year=2020&make=Toyota&model=RAV4&zipCode=90210` |
| Airfare        | `GET /services/airfare?origin=JFK&destination=LAX` |
| Providers (Haircuts) | `GET /services/providers?category=haircuts&serviceType=mens&zipCode=90210` |
| Providers (Spa)     | `GET /services/providers?category=spa&serviceType=massage&zipCode=90210` |
| Providers (Nail)    | `GET /services/providers?category=nail-salons&serviceType=manicure&zipCode=90210` |

If you see **500**: check the backend console; often the cause is a missing or invalid `SERPER_API_KEY`.

---

## 2. Analytics categories (to define)

- **Clarify:** Do you mean:
  - **A)** Analytics *for* categories (e.g. “most compared products”, “popular categories”, “search trends”), or  
  - **B)** New *category types* that are “analytics” (e.g. dashboards, reports)?
- **Suggested first step:**  
  - Backend: store events (e.g. search, compare, category view) and expose simple aggregates (counts, top N).  
  - Frontend: a small “Analytics” or “Insights” section (e.g. popular categories, recent searches).  
- **Next:** Once you confirm A vs B (and which metrics matter), we can design the exact APIs and screens.

---

## 3. Stripe integration – subscriptions

### 3.1 Tiers (as you specified)

| Plan     | Monthly | Yearly (optional discount) |
|----------|---------|----------------------------|
| **Basic**   | $6/mo  | e.g. $60/year (2 months free) |
| **Premium** | $12/mo | e.g. $120/year (2 months free) |
| **Pro / Top** | $25/mo | e.g. $250/year (2 months free) |

You can change the yearly amounts; Stripe supports any price.

### 3.2 What to build

**Backend (NestJS):**

1. **Stripe SDK**
   - `npm install stripe` (or `@stripe/stripe-js` only on client if you prefer).
   - Prefer creating Prices and Customers on the server with the Stripe Node SDK; use Stripe.js on the client only for payment methods / Checkout.

2. **Env**
   - `STRIPE_SECRET_KEY=sk_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (for subscription events).

3. **Products & Prices in Stripe**
   - Create 3 Products: Basic, Premium, Pro.
   - For each product, create 2 Prices:
     - One recurring monthly (e.g. $6, $12, $25).
     - One recurring yearly (e.g. $60, $120, $250).
   - Store Price IDs in config or DB (e.g. `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_BASIC_YEARLY`, …).

4. **API endpoints (examples)**
   - `POST /payments/create-checkout-session`  
     Body: `{ planId: 'basic'|'premium'|'pro', interval: 'monthly'|'yearly' }`  
     → Create Stripe Checkout Session with the right Price ID, return `session.url` for redirect.
   - `POST /payments/webhook`  
     → Stripe webhook; handle `customer.subscription.created/updated/deleted` and update your DB (e.g. user’s `subscriptionStatus`, `plan`, `currentPeriodEnd`).
   - `GET /payments/subscription` (or `/users/me/subscription`)  
     → Return current user’s plan, status, period end (from your DB).

5. **DB (e.g. Prisma)**
   - On `User` (or a `Subscription` table):  
     `stripeCustomerId`, `stripeSubscriptionId`, `plan` (basic/premium/pro), `interval` (monthly/yearly), `status` (active/canceled/past_due), `currentPeriodEnd`.

6. **Auth**
   - All payment and subscription endpoints should require an authenticated user (JWT/session). Attach `stripeCustomerId` to the user when they complete the first checkout.

**Frontend:**

1. **Pricing page**
   - Show 3 plans: Basic $6, Premium $12, Pro $25.
   - Toggle or two buttons: “Monthly” / “Yearly” (show yearly price and “Save X%” if you want).
   - “Subscribe” → call `POST /payments/create-checkout-session` with selected plan + interval → redirect to `session.url` (Stripe Checkout).

2. **After payment**
   - Redirect to a “Success” or “Account” page; optionally call `GET /payments/subscription` to show current plan.

3. **Gating**
   - For “premium” features, send JWT and check `GET /payments/subscription` (or a backend middleware that checks plan/status) and show upgrade prompt if not subscribed or plan too low.

### 3.3 Flow summary

1. User chooses plan (Basic/Premium/Pro) and interval (monthly/yearly).
2. Frontend calls your backend → backend creates Stripe Checkout Session → user is redirected to Stripe.
3. User pays on Stripe; Stripe redirects back to your success URL.
4. Stripe sends webhooks (subscription created/updated/deleted); backend updates DB.
5. Backend uses DB (plan, status, period end) to enforce access; frontend can hide or show features based on plan.

---

## 4. Suggested order of work

1. **Fix service categories 500** (ensure `SERPER_API_KEY` is set and re-run `test-all-service-categories.ts`).
2. **Define “analytics categories”** (A vs B above and which metrics).
3. **Stripe:** create Products/Prices in Stripe Dashboard, then implement backend (env, webhook, checkout session, DB fields), then pricing UI and subscription check.

If you tell me whether you want to start with **analytics** or **Stripe** first, I can outline the exact files and code changes next (e.g. new `payments` module and DTOs, or analytics events + endpoints).
