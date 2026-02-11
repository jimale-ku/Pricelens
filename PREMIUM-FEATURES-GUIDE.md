# PriceLens Plus – Premium Features List & How to Add Them

This doc lists all **8 premium features** shown on the Plus upgrade page and how each is (or can be) added to the app.

---

## 1. Coupon Finder

**What it is:** Access thousands of grocery (and other) coupons – search, filter by store, copy codes.

**Current state:**
- **Plus dashboard (VIEW 2):** UI only. Search bar, store filter, stat boxes (Available Coupons, Partner Stores, etc.), and **mock coupon cards** with store/category/discount, description, expiry, and a **Copy** button (wired to local state only). Data is hardcoded in `client/app/(tabs)/plus.tsx` (`MOCK_COUPONS`).
- **Backend:** No coupon API or DB table yet.

**How to add it for real:**
1. **Backend**
   - Add a **Coupon** (or similar) model in Prisma: store, category, code, description, discount, minPurchase, expiresAt, etc. Optionally add a coupons API module that scrapes or ingests from a coupon provider (e.g. affiliate/partner API).
   - Add routes, e.g. `GET /coupons` (search/filter by store, category), protected with `JwtAuthGuard` and optionally `RequireSubscription('BASIC')` if you want it Plus-only.
2. **Frontend**
   - Replace `MOCK_COUPONS` with a fetch to your coupons API. Use the same card UI; drive it from API response. Keep Copy button and optionally use `expo-clipboard` to copy the code.

---

## 2. Cashback Rewards

**What it is:** Earn cashback (e.g. up to 5%) at participating retailers; “Available” vs “Pending”; redeem when over a minimum (e.g. $10).

**Current state:**
- **Plus dashboard:** UI only. “Available Cashback” card ($23.47, “Redeem Cashback”), “Pending” card ($15.89, processing note), “This month / Lifetime” stats, **Participating retailers** grid (emoji + name + rate), and a “How it works” box. All values are static.
- **Backend:** No cashback balance, transactions, or redemption logic.

**How to add it for real:**
1. **Backend**
   - Add **CashbackBalance** (userId, availableCents, pendingCents, lifetimeCents, currency) and **CashbackTransaction** (userId, amount, type: earned | pending | redeemed, orderId, retailer, etc.). Add a cashback service that:
     - Updates balances when orders are tracked (e.g. via affiliate/partner webhooks or manual entry).
     - Exposes `GET /cashback/balance`, `POST /cashback/redeem` (e.g. when balance ≥ $10).
   - Protect cashback routes with `JwtAuthGuard` and `RequireSubscription('BASIC')`.
2. **Frontend**
   - Replace static amounts and stats with API data. Wire “Redeem Cashback” to `POST /cashback/redeem` and refresh balance after success.

---

## 3. In-Store Price Scanner (Barcode)

**What it is:** Scan a barcode in-store and see price comparison across stores.

**Current state:**
- **Plus dashboard:** Placeholder block with “Scan Barcode” button; no camera or barcode logic.
- **Backend:** Product search **already supports barcode (GTIN)**. `products.controller.ts` has search/compare that accept a product name or barcode; `products.service.ts` and store adapters (Walmart, Best Buy, eBay, Amazon) support `getProductPrice(barcode)`.

**How to add it for real:**
1. **Frontend**
   - Install a barcode scanner (e.g. `expo-barcode-scanner` or `react-native-camera` with barcode). On Plus tab (or a dedicated “Scanner” screen), add a camera view and on barcode scan get the code string.
   - Call your existing compare API with that barcode (e.g. `GET /products/compare/multi-store?q=<barcode>&searchType=gtin`), then show the same comparison UI you use for search (e.g. redirect to compare route or a modal with store prices).
2. **Access control**
   - If you want this Plus-only: guard the scanner screen or the compare endpoint with subscription check (e.g. `RequireSubscription('BASIC')` on the route that returns multi-store comparison for GTIN).

---

## 4. Camera Product Scanner

**What it is:** Take a photo of a product and get product name + prices (e.g. via image recognition).

**Current state:**
- **Plus dashboard:** Placeholder with “Open Camera” button; no camera or AI.

**How to add it for real:**
1. **Backend**
   - Add an endpoint that accepts an image (e.g. `POST /products/recognize`). Use a vision API (e.g. Google Vision, OpenAI Vision, or a product-recognition API) to get product name and/or barcode from the image, then reuse your existing product/price logic (search by name or barcode and return compare data).
2. **Frontend**
   - Use `expo-image-picker` (or similar) to take a photo, send it to `POST /products/recognize`, then show the same comparison UI as for barcode or text search. Optionally restrict this screen or endpoint to Plus with `RequireSubscription('BASIC')`.

---

## 5. AI Receipt Scanner

**What it is:** Upload a receipt image; AI extracts line items and suggests where you could have saved (e.g. lower prices, coupons).

**Current state:**
- **Plus dashboard:** Placeholder “Upload Receipt” button; no upload or analysis.

**How to add it for real:**
1. **Backend**
   - Add `POST /receipts/analyze`: accept image (multipart), call a vision/OCR API (e.g. Google Document AI, AWS Textract, or a receipt-specific API) to get line items (product name, price, store). Optionally compare each item to your product/price DB or coupon DB and compute “could have saved” suggestions. Store results per user if you want history.
   - Protect with `JwtAuthGuard` and `RequireSubscription('BASIC')`.
2. **Frontend**
   - Use `expo-image-picker` to pick a receipt image, upload to `POST /receipts/analyze`, then show a “Savings breakdown” screen (e.g. list of items + suggested alternatives or coupon matches).

---

## 6. Price Drop Alerts

**What it is:** User sets a target price for a product; gets notified when price drops to or below that target.

**Current state:**
- **Backend:** Implemented. `alerts` module: create/read/update/delete price alerts; job `check-price-alerts` runs periodically and triggers notifications (e.g. email placeholder in `alert-notification.processor.ts`). Plan limits: Free 1 alert, Basic 5, etc. (in seed).
- **Frontend:** No dedicated “Price Drop Alerts” UI in the app yet (no screen that lists alerts or creates them with target price). Plus page only mentions the feature.

**How to add it for real:**
1. **Frontend**
   - Add a screen (e.g. under Profile or Lists) “Price alerts” or “Price drop alerts”: list user’s alerts (from `GET /alerts`), “Add alert” (product + target price) calling `POST /alerts`, edit/delete. Optionally show it only when user has Plus (check subscription in app and hide or show “Upgrade to set more alerts” when at limit).
2. **Backend**
   - Already has limits in plan (`maxAlerts`). Optionally enforce them in `AlertsService.createAlert` (compare user’s current alert count to plan). If you want alerts to be Plus-only, add `RequireSubscription('BASIC')` on the alerts controller (or on create only).

---

## 7. Advanced Analytics

**What it is:** Detailed spending insights (e.g. by category, store, over time).

**Current state:**
- **Frontend:** `client/app/(tabs)/analytics.tsx` is a **placeholder dashboard**: “Analytics Dashboard” with static stats (Total Users, Active Today, Searches, Savings). No real user-specific spending data.
- **Backend:** No analytics API that returns “user spending by category/store/time”. You have purchase history (e.g. `purchaseHistoryService` on client), but no aggregated analytics endpoint.

**How to add it for real:**
1. **Backend**
   - Define what “advanced analytics” means (e.g. spending by category, by store, monthly totals). If you have purchase/order data in DB, add an **Analytics** service that aggregates by userId, category, store, date range. Expose e.g. `GET /analytics/spending?from=...&to=...` returning aggregates. Protect with `JwtAuthGuard` and `RequireSubscription('BASIC')` or `PRO`.
2. **Frontend**
   - Replace placeholder analytics screen with charts (e.g. `react-native-chart-kit` or similar): spending over time, by category, by store. Call the new analytics API. Optionally show this screen only for Plus users (check subscription before rendering or before calling API).

---

## 8. Smart Recommendations

**What it is:** AI-powered suggestions (e.g. “based on your lists/favorites, try these” or “often bought together”).

**Current state:**
- **Mentioned:** On the Plus page and in `StatsSection` (“AI Recommendations”). No dedicated recommendations API or UI (e.g. a “For you” section that calls a recommendations endpoint).

**How to add it for real:**
1. **Backend**
   - Add a recommendations service that takes userId and returns suggested products (e.g. based on favorites, list items, or purchase history). Logic can be simple at first (e.g. “products in same category as favorites” or “popular in categories you use”) or use an ML/AI API. Expose e.g. `GET /recommendations` (optional limit/category). Protect with `JwtAuthGuard` and `RequireSubscription('BASIC')`.
2. **Frontend**
   - Add a “For you” or “Recommended” section on Home or Search that calls `GET /recommendations` and shows product cards. Optionally show only for Plus users.

---

## How “Plus” is enforced today

- **Subscription tiers:** `server/src/subscriptions/subscription-tiers.ts`: FREE, BASIC, PRO, PLUS (legacy), PREMIUM. `meetsMinimumTier(userTier, requiredTier)` is used by `SubscriptionGuard`.
- **Guards:** `RequireSubscription('BASIC')` (or `'PRO'` / `'PREMIUM'`) can be applied to any controller or route so only users with that tier or higher can call it. Right now **no route uses `RequireSubscription`**; only `JwtAuthGuard` is used (e.g. alerts, subscriptions/me, checkout).
- **Frontend:** Plus dashboard (VIEW 2) is shown when `GET /subscriptions/me` returns status `ACTIVE` or `TRIALING`. Individual features (coupons, cashback, scanners, etc.) are not yet gated by subscription on the client; you can add checks (e.g. “Only show Coupon Finder section if Plus”) by reading the same subscription state.

---

## Summary table

| Feature                   | Backend state              | Frontend state                    | How to add for real                                      |
|---------------------------|----------------------------|-----------------------------------|----------------------------------------------------------|
| Coupon Finder             | None                       | Mock UI + static data             | Coupon API/DB + replace mock with API + optional tier guard |
| Cashback Rewards          | None                       | Static UI                         | Balance/transaction API + redemption + optional tier guard |
| In-Store Price Scanner    | Barcode search exists      | Placeholder button                | Barcode scanner lib + call existing compare API + optional tier guard |
| Camera Product Scanner    | None                       | Placeholder button                | Vision API + recognize endpoint + compare + optional tier guard |
| AI Receipt Scanner        | None                       | Placeholder button                | OCR/receipt API + analyze endpoint + savings UI + tier guard |
| Price Drop Alerts         | Implemented (alerts + job) | No alerts UI in app               | Alerts screen (list/create/delete) + optional tier guard |
| Advanced Analytics        | None                       | Placeholder dashboard             | Spending aggregation API + charts + tier guard           |
| Smart Recommendations     | None                       | Mention only                      | Recommendations API + “For you” section + tier guard    |

To make a feature **Plus-only**, add `@UseGuards(JwtAuthGuard, SubscriptionGuard)` and `@RequireSubscription('BASIC')` (or desired tier) on the controller or route, and optionally hide the UI for non-Plus users using subscription status from `GET /subscriptions/me`.
