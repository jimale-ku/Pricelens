# Premium gating: confirm paid users, block non‑paid

## How we confirm premium features work for paying users

1. **Backend**
   - `GET /api/subscriptions/me` (with JWT) returns the user’s subscription: `status` and `tier`.
   - Paying users have `status === 'ACTIVE'` or `'TRIALING'` and `tier` in `['BASIC','PRO','PLUS','PREMIUM']`.
   - Premium routes use `SubscriptionGuard` + `@RequireSubscription('BASIC')`: only these users get 200; others get **403**.

2. **Client**
   - `useSubscription()` (in `client/hooks/useSubscription.ts`) calls `GET /subscriptions/me` and sets `isPremium` when status is ACTIVE/TRIALING and tier is paid.
   - **Plus screen**: uses `isPremium` to show the **Plus dashboard** (cashback, coupons, receipt scanner, etc.) for paying users.
   - **App header**: uses `isPremium` to show **“Plus”** vs **“Upgrade”** on the plus button.
   - So: if the client sees `isPremium === true`, the backend will allow premium endpoints; if the user pays, the next load of the app (or refetch) will set `isPremium` to true and all premium features work.

## How we block premium features for non‑paying users

1. **Backend (enforcement)**
   - **Receipts**: `POST /receipts/analyze` and `POST /receipts/analyze-sample` use `JwtAuthGuard` + `SubscriptionGuard` + `@RequireSubscription('BASIC')`. Non‑BASIC or inactive → **403**.
   - **Alerts**: entire `AlertsController` uses `JwtAuthGuard` + `SubscriptionGuard` + `@RequireSubscription('BASIC')`. Non‑BASIC or inactive → **403** on list/create/update/delete.
   - Other premium endpoints can be gated the same way.

2. **Client (UI and 403 handling)**
   - **Alerts screen**: If `!isPremium`, we show a **“PriceLens Plus Required”** gate and an “Upgrade to Plus” button; no list or create. Any alerts API call that returns **403** triggers an upgrade alert and optional navigation to Plus.
   - **Barcode scanner**: If `!isPremium`, we show a **“PriceLens Plus Required”** gate and “Upgrade to Plus”; scan/search is blocked.
   - **Plus screen**: Non‑premium users see the **upgrade** view (hero, pricing, features, CTA); only premium users see the Plus dashboard and receipt scanner.
   - **Receipt API**: Used only in the Plus dashboard (premium view). If a 403 is ever returned (e.g. expired subscription), the existing error handling can be extended to show an upgrade message.

## Summary

| Area            | Confirm premium (paying user)     | Block non‑paying                         |
|-----------------|-----------------------------------|------------------------------------------|
| **Backend**     | `/subscriptions/me` returns tier/status; guards allow BASIC+ | 403 on receipts + alerts for non‑BASIC/inactive |
| **Client**      | `useSubscription()` → `isPremium`; Plus tab shows dashboard | Gate screens + 403 → “Upgrade to Plus” on alerts & barcode |
| **Header**      | “Plus” when `isPremium`          | “Upgrade” when not                       |

To add a new premium feature: protect its API with `SubscriptionGuard` and `@RequireSubscription('BASIC')`, and on the client use `useSubscription().isPremium` to show a gate or disable the feature and handle 403 with an upgrade prompt.
