# Profile, Subscription Tiers & Bottom Nav

## Bottom navigation (4 items)

The app has **one** bottom bar with four items:

| Icon   | Label   | Route         | Behavior |
|--------|--------|---------------|----------|
| Home   | Home   | `/(tabs)`     | Homepage with category grid |
| Search | Search | `/(tabs)/search` → redirects to All Retailers | Unified search |
| List   | Lists  | `/(tabs)/lists` | Shopping lists, bulk upload, saved lists |
| Person | Profile| `/(tabs)/profile` | Profile, subscription, settings, logout |

- **On tab screens** (Home, Search, Lists, Profile): the **native Expo Router tab bar** is shown; tapping an item switches the tab.
- **On category screens** (e.g. Groceries, Electronics): the **custom BottomNav** component is shown; tapping an item **replaces** the current screen with that tab (so you don’t stack category → tab → back to category).

All four items are wired and functional.

---

## Profile page

- **Header**: avatar placeholder, “Profile”, short subtitle.
- **Subscription**: shows “Current plan: Free” and a **“View plans & upgrade”** button that goes to the **Plus** screen.
- **Settings**: Account, Notifications, Location, Payment Methods (UI only for now).
- **Logout**: confirms then replaces to `/(auth)/login`.

---

## How subscription tiers are used

### Backend (NestJS)

- **Tiers**: `FREE`, `BASIC`, `PRO`, `PLUS`, `PREMIUM` (see `server/src/subscriptions/subscription-tiers.ts`).
- **Plans** are stored in DB (`SubscriptionPlan`); each plan can have Stripe Price IDs (monthly/yearly).
- **APIs**:
  - `GET /subscriptions/plans` – list all plans (no auth).
  - `GET /subscriptions/me` – current user’s subscription (JWT).
  - `POST /subscriptions/checkout` – create Stripe Checkout session (JWT).
  - `POST /subscriptions/cancel` – cancel at period end (JWT).
  - `POST /subscriptions/webhook` – Stripe webhook for subscription lifecycle.

### How tiers are “accessed”

1. **In the app**: User opens **Profile** → **“View plans & upgrade”** → **Plus** screen (plans and benefits). Actual upgrade is done later via Stripe Checkout from the client.
2. **On the server**: After login, the backend can use `GET /subscriptions/me` to know the user’s tier and guard premium routes (e.g. with `@RequireSubscription('PRO')` or similar).

So: **tiers are accessed** via Profile → Plus in the UI, and via `/subscriptions/me` (and optional guards) on the backend.

---

## Stripe integration

- **Backend**: Stripe **is** integrated on the server:
  - `stripe` package and `SubscriptionsService` create Checkout sessions and handle the webhook.
  - Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; optional per-plan `stripePriceId` / `stripePriceIdYearly` in DB or config.
- **Client**: Not yet wired for checkout:
  - Profile and Plus screens do **not** call `/subscriptions/checkout` or open Stripe Checkout yet.
  - API base URL and subscription endpoints are in `client/constants/api.ts` (`subscriptions.me`, `subscriptions.plans`, `subscriptions.checkout`, `subscriptions.cancel`) so you can add “Upgrade” → create session → redirect to Stripe when ready.

Summary: **Stripe is integrated on the backend** (checkout + webhook); **tiers are exposed in the app** via Profile and Plus; **payments from the app** will work once the client calls `POST /subscriptions/checkout` and redirects to the returned Stripe URL.
