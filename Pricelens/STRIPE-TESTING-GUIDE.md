# Stripe Testing Guide for the Client

Use this to test subscriptions in the app **without real charges**. Everything runs in Stripe **Test mode**.

---

## 1. Backend setup (you or dev)

- **Render:** In your Render service → **Environment**, add:
  - **STRIPE_SECRET_KEY** = your Stripe **test** secret key (`sk_test_...` from [Stripe Dashboard → API keys](https://dashboard.stripe.com/test/apikeys)).
- Save and **redeploy** so the server picks up the variable.

No need to create Products/Prices in Stripe for a first test: the app can create a subscription from the plan’s price (e.g. $4.99/month) when no Stripe Price ID is set.

---

## 2. Confirm Stripe is on

1. Open in a browser:
   ```
   https://pricelens-1.onrender.com/subscriptions/config
   ```
2. You should see:
   ```json
   { "stripeTestMode": true }
   ```
3. In the app, open the **Plus** tab. You should see an orange banner: **“Stripe Test Mode — no real charges”.**

If you see that, Stripe is configured and in test mode.

---

## 3. Test the subscription flow

1. **Log in** in the app (checkout requires an account).
2. Go to the **Plus** tab.
3. Tap **“Start 30-day free trial”** (or the main upgrade button).
4. You’ll be sent to **Stripe Checkout** (browser or in-app browser).
5. Use Stripe’s **test card**:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** any future date (e.g. `12/34`)
   - **CVC:** any 3 digits (e.g. `123`)
   - **ZIP:** any 5 digits (e.g. `12345`)
6. Complete payment. In test mode **no real charge** is made.
7. You should be redirected back to the app and see a success message; the Plus screen should show you as a subscriber.

---

## 4. Other test cards (optional)

Stripe provides more test cards for different cases:

| Card number         | Use case              |
|---------------------|------------------------|
| 4242 4242 4242 4242 | Successful payment     |
| 4000 0000 0000 0002 | Card declined          |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

Full list: [Stripe Testing – test cards](https://docs.stripe.com/testing#cards).

---

## 5. What to check

- **Plus screen** shows “Stripe Test Mode” when the backend is in test mode.
- **Checkout** opens when you tap the upgrade button (and you’re logged in).
- **Payment** completes with `4242 4242 4242 4242`.
- After payment, the app shows **success** and treats you as a **Plus subscriber**.

If any step fails, check:

- Render env has **STRIPE_SECRET_KEY** (test key) and the service was **redeployed**.
- You are **logged in** in the app.
- Backend is **awake** (first request after idle can be slow; try opening `/subscriptions/config` first).

---

## 6. Going live later

When you’re ready for real payments:

1. In Stripe Dashboard, switch to **Live** and create **live** API keys.
2. (Optional) Create Products and Prices in Stripe for your plans and add the Price IDs to Render (e.g. `STRIPE_PRICE_ID_BASIC_MONTHLY`).
3. In Render, replace **STRIPE_SECRET_KEY** with your **live** secret key (`sk_live_...`).
4. Redeploy. The app will no longer show “Stripe Test Mode” and will process real payments.
